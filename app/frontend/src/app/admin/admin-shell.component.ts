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
        { label: 'Tổng quan', route: '/superadmin/lifecycle', icon: 'overview' },
        { label: 'Bảng Tổng', route: '/superadmin/scorecards', icon: 'spreadsheet' },
        { label: 'Phiên bản', route: '/superadmin/versions', icon: 'versions' },
        { label: 'Điều hành chấm', route: '/superadmin/review-control', icon: 'organization' },
        { label: 'Kết quả & đối soát', route: '/superadmin/results', icon: 'results' },
        { label: 'Tổ & cán bộ', route: '/superadmin/teams', icon: 'accounts' },
      ],
    },
    {
      label: 'Quản trị hệ thống',
      items: [
        { label: 'Cơ cấu tổ chức', route: '/superadmin/structure', icon: 'accounts' },
        { label: 'Tài khoản & quyền', route: '/superadmin/accounts', icon: 'accounts' },
      ],
    },
  ],
  'campaign-admin': [
    {
      items: [
        { label: 'Tổng quan', route: '/admin/lifecycle', icon: 'overview' },
        {
          label: 'Bảng Tổng',
          route: '/admin/scorecard-templates',
          icon: 'spreadsheet',
        },
        { label: 'Phiên bản', route: '/admin/versions', icon: 'versions' },
        { label: 'Điều hành chấm', route: '/admin/review-control', icon: 'organization' },
        { label: 'Kết quả & đối soát', route: '/admin/results', icon: 'results' },
        { label: 'Tổ & cán bộ', route: '/admin/teams', icon: 'accounts' },
      ],
    },
  ],
  unit: [
    {
      items: [
        { label: 'Tự chấm', route: '/unit/tasks', icon: 'document' },
        { label: 'Giải trình', route: '/unit/results', icon: 'results' },
        { label: 'Kết quả cuối', route: '/unit/final', icon: 'campaign' },
      ],
    },
  ],
  reviewer: [
    {
      items: [
        { label: 'Công việc chấm', route: '/reviewer/queue', icon: 'document' },
        { label: 'Lịch sử chấm', route: '/reviewer/history', icon: 'versions' },
        { label: 'Kết quả', route: '/reviewer/results', icon: 'results' },
      ],
    },
  ],
};

const WORKSPACE_META = {
  superadmin: { label: 'Superadmin', scope: 'Toàn hệ thống', home: '/superadmin/lifecycle' },
  'campaign-admin': {
    label: 'Admin chiến dịch',
    scope: 'Phạm vi chiến dịch hiện hành',
    home: '/admin/scorecard-templates',
  },
  unit: { label: 'Đơn vị', scope: 'Công việc được giao', home: '/unit/tasks' },
  reviewer: { label: 'Tổ thẩm định', scope: 'Hồ sơ được phân công', home: '/reviewer/queue' },
} satisfies Record<Workspace, WorkspaceMeta>;

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent],
  templateUrl: './admin-shell.component.html',
  styleUrls: [
    './admin-shell-sidebar.css',
    './admin-shell-frame.css',
    './admin-shell-responsive.css',
  ],
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
  protected readonly sidebarCollapsed = signal(
    this.document.defaultView?.matchMedia('(min-width: 960px) and (max-width: 1279px)').matches ??
      false,
  );
  protected readonly profileOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly refreshingSession = signal(false);
  protected readonly accountError = signal('');
  protected readonly initials = computed(() => {
    const parts = this.auth.account()?.displayName.trim().split(/\s+/) ?? [];
    return (
      parts
        .slice(-2)
        .map((part) => part[0]?.toLocaleUpperCase('vi'))
        .join('') || 'QT'
    );
  });
  protected readonly profileLabel = computed(() =>
    this.workspace === 'campaign-admin' ? 'Hải Phòng' : this.auth.account()?.displayName,
  );
  protected readonly sessionTimeRemaining = computed(() => {
    const remaining = this.session.remainingSeconds() ?? 0;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.dismissTransientLayers();
      }
    });
  }

  protected toggleDrawer(): void {
    this.closeProfile();
    this.drawerOpen.update((open) => !open);
  }
  protected closeDrawer(): void {
    this.drawerOpen.set(false);
    this.closeProfile();
  }
  protected toggleSidebar(): void {
    this.closeProfile();
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
  protected focusMain(event: Event): void {
    event.preventDefault();
    this.document.getElementById('admin-main')?.focus();
  }
  protected toggleProfile(): void {
    const shouldOpen = !this.profileOpen();
    this.profileOpen.set(shouldOpen);
    this.accountError.set('');
    if (shouldOpen) {
      window.setTimeout(() => this.document.getElementById('account-menu')?.focus());
    }
  }

  protected closeProfile(): void {
    this.profileOpen.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  protected closeProfileFromOutside(event: PointerEvent): void {
    if (!this.profileOpen() || !(event.target instanceof Element)) return;
    if (event.target.closest('#account-menu, [data-profile-sidebar]')) {
      return;
    }
    this.closeProfile();
  }

  @HostListener('window:blur')
  protected closeProfileWhenWindowLosesFocus(): void {
    this.closeProfile();
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
    if (this.profileOpen()) {
      this.profileOpen.set(false);
      this.document.querySelector<HTMLElement>('[data-profile-sidebar]')?.focus();
      return;
    }
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
      this.document.querySelector<HTMLElement>('[data-menu-trigger]')?.focus();
    }
  }

  private dismissTransientLayers(): void {
    this.drawerOpen.set(false);
    this.profileOpen.set(false);
  }
}
