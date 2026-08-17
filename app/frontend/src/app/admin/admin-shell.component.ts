import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  Data,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { SessionLifecycleService } from '../core/auth/session-lifecycle.service';
import { AppIconComponent, AppIconName } from '../shared/app-icon.component';

type Workspace = 'superadmin' | 'campaign-admin' | 'unit' | 'reviewer';
interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly icon: AppIconName;
}
interface NavigationGroup {
  readonly label?: string;
  readonly items: readonly NavigationItem[];
}
interface WorkspaceMeta {
  readonly label: string;
  readonly scope: string;
  readonly home: string;
}
interface WorkspaceNavigation {
  readonly superadmin: readonly NavigationGroup[];
  readonly 'campaign-admin': readonly NavigationGroup[];
  readonly unit: readonly NavigationGroup[];
  readonly reviewer: readonly NavigationGroup[];
}

/** Dữ liệu route là `any` của Angular; chỉ chấp nhận workspace đã khai báo trong routes. */
function workspaceFromRoute(data: Data): Workspace {
  const workspace = data['workspace'];
  return workspace === 'superadmin' ||
    workspace === 'campaign-admin' ||
    workspace === 'unit' ||
    workspace === 'reviewer'
    ? workspace
    : 'campaign-admin';
}

const NAVIGATION: WorkspaceNavigation = {
  superadmin: [
    {
      items: [
        { label: 'Vòng đời chiến dịch', route: '/superadmin/lifecycle', icon: 'overview' },
        { label: 'Bảng điểm & phân công', route: '/superadmin/scorecards', icon: 'spreadsheet' },
        { label: 'Kết quả & đối soát', route: '/superadmin/results', icon: 'check' },
      ],
    },
    {
      label: 'Quản trị truy cập',
      items: [
        { label: 'Cơ cấu tổ chức', route: '/superadmin/structure', icon: 'accounts' },
        { label: 'Tài khoản & quyền', route: '/superadmin/accounts', icon: 'accounts' },
      ],
    },
  ],
  'campaign-admin': [
    {
      items: [
        {
          label: 'Bảng điểm & phân công',
          route: '/admin/scorecard-templates',
          icon: 'spreadsheet',
        },
        { label: 'Vòng đời chiến dịch', route: '/admin/lifecycle', icon: 'overview' },
        { label: 'Kết quả & đối soát', route: '/admin/results', icon: 'check' },
      ],
    },
  ],
  unit: [{ items: [{ label: 'Việc cần thực hiện', route: '/unit/tasks', icon: 'overview' }] }],
  reviewer: [{ items: [{ label: 'Hàng chờ thẩm định', route: '/reviewer/queue', icon: 'check' }] }],
};

const WORKSPACE_META = {
  superadmin: { label: 'Superadmin', scope: 'Toàn hệ thống', home: '/superadmin/lifecycle' },
  'campaign-admin': {
    label: 'Admin chiến dịch',
    scope: 'TNTN Hè 2026',
    home: '/admin/scorecard-templates',
  },
  unit: { label: 'Đơn vị', scope: 'Công việc được giao', home: '/unit/tasks' },
  reviewer: { label: 'Tổ thẩm định', scope: 'Hồ sơ được phân công', home: '/reviewer/queue' },
} satisfies Record<Workspace, WorkspaceMeta>;

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);
  protected readonly session = inject(SessionLifecycleService);

  protected readonly workspace = workspaceFromRoute(this.route.snapshot.data);
  protected readonly workspaceMeta = WORKSPACE_META[this.workspace];
  protected readonly navigation = NAVIGATION[this.workspace];
  protected readonly drawerOpen = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly profileOrigin = signal<'sidebar' | 'topbar'>('sidebar');
  protected readonly loggingOut = signal(false);
  protected readonly refreshingSession = signal(false);
  protected readonly accountError = signal('');
  protected readonly topbarTitle = signal('');
  protected readonly topbarDetail = signal('');
  protected readonly initials = computed(() => {
    const parts = this.auth.account()?.displayName.trim().split(/\s+/) ?? [];
    return (
      parts
        .slice(-2)
        .map((part) => part[0]?.toLocaleUpperCase('vi'))
        .join('') || 'QT'
    );
  });
  protected readonly canSwitchWorkspace = computed(
    () => this.auth.account()?.role === 'SUPERADMIN',
  );
  protected readonly sessionTimeRemaining = computed(() => {
    const remaining = this.session.remainingSeconds() ?? 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  constructor() {
    this.updateRouteContext(this.router.url);
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.updateRouteContext(event.urlAfterRedirects);
    });
  }

  protected toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }
  protected closeDrawer(): void {
    this.drawerOpen.set(false);
  }
  protected focusMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('admin-main')?.focus();
  }
  protected toggleProfile(origin: 'sidebar' | 'topbar'): void {
    const shouldOpen = !this.profileOpen() || this.profileOrigin() !== origin;
    this.profileOrigin.set(origin);
    this.profileOpen.set(shouldOpen);
    this.accountError.set('');
    if (shouldOpen) {
      window.setTimeout(() => this.document.getElementById('account-menu')?.focus());
    }
  }

  protected closeProfile(): void {
    this.profileOpen.set(false);
  }

  protected async logout(): Promise<void> {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.accountError.set('');
    try {
      await this.auth.logout();
      await this.router.navigate(['/login'], {
        queryParams: { reason: 'logged-out' },
        replaceUrl: true,
      });
    } catch {
      this.accountError.set('Chưa thể đăng xuất. Kiểm tra kết nối rồi thử lại.');
    } finally {
      this.loggingOut.set(false);
    }
  }

  protected async extendSession(): Promise<void> {
    if (this.refreshingSession()) return;
    this.refreshingSession.set(true);
    try {
      await this.auth.refresh();
    } catch {
      this.auth.clear();
      await this.router.navigate(['/login'], {
        queryParams: { reason: 'session-expired', returnUrl: this.router.url },
        replaceUrl: true,
      });
    } finally {
      this.refreshingSession.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeTransientLayers(): void {
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
      this.document.querySelector<HTMLElement>('[data-menu-trigger]')?.focus();
    }
    if (this.profileOpen()) {
      this.profileOpen.set(false);
      const selector =
        this.profileOrigin() === 'topbar' ? '[data-profile-topbar]' : '[data-profile-sidebar]';
      this.document.querySelector<HTMLElement>(selector)?.focus();
    }
  }

  private updateRouteContext(url: string): void {
    const path = url.split('?')[0];
    if (path.includes('scorecard')) {
      this.topbarTitle.set('Bảng điểm khối Đại học, Cao đẳng');
      this.topbarDetail.set('Nguồn Excel đã đối soát · 55 dòng chấm');
    } else if (path.includes('accounts')) {
      this.topbarTitle.set('Tài khoản và quyền');
      this.topbarDetail.set('Identity & Access · Server-authorized');
    } else if (path.includes('structure')) {
      this.topbarTitle.set('Cơ cấu tổ chức');
      this.topbarDetail.set('Đơn vị và tổ theo dõi · Dữ liệu do Superadmin xác nhận');
    } else if (path.includes('queue')) {
      this.topbarTitle.set('Hàng chờ thẩm định');
      this.topbarDetail.set('Theo đúng tổ và phân công');
    } else if (path.includes('tasks')) {
      this.topbarTitle.set('Việc cần thực hiện');
      this.topbarDetail.set('Theo đúng đơn vị và khối');
    } else if (path.includes('results')) {
      this.topbarTitle.set('Kết quả và đối soát');
      this.topbarDetail.set('Snapshot bất biến · Duyệt bốn mắt · Excel');
    } else {
      this.topbarTitle.set('Vòng đời chiến dịch');
      this.topbarDetail.set('Trạng thái dữ liệu thật');
    }
  }
}
