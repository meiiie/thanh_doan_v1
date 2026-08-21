import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AssignmentPlan, AssignmentWorkbench, ScorecardCatalog } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';
import { AppIconComponent } from '../../shared/app-icon.component';
import { CampaignPhase } from '../../shared/domain-types';
import { targetValue } from '../../shared/form-events';
import { buildTeamDirectory } from '../organization/team-directory';
import {
  advanceEndpoint,
  assignmentIsReady,
  campaignPhaseLabel,
  scorecardGroupRows,
  type AdvanceEndpoint,
  type ScorecardGroupRow,
  type ScorecardSection,
} from './scorecard-workbench';

type AssignmentStatusFilter = 'ALL' | 'UNALLOCATED' | 'UNASSIGNED' | 'READY';

@Component({
  selector: 'app-scorecard-catalog-page',
  imports: [FormsModule, RouterLink, AppIconComponent],
  templateUrl: './scorecard-catalog.page.html',
  styleUrls: [
    './scorecard-catalog.page.css',
    './scorecard-toolbar.css',
    './scorecard-table.css',
    './scorecard-inspector.css',
    './scorecard-responsive.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorecardCatalogPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly teamsRoute = this.router.url.startsWith('/superadmin')
    ? '/superadmin/teams'
    : '/admin/teams';
  protected readonly catalog = signal<ScorecardCatalog | null>(null);
  protected readonly workbench = signal<AssignmentWorkbench | null>(null);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly saving = signal(false);
  protected readonly query = signal('');
  protected readonly section = signal<ScorecardSection>('ALL');
  protected readonly status = signal<AssignmentStatusFilter>('ALL');
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly sourceOpen = signal(false);
  protected readonly selectedGroups = signal<readonly string[]>([]);
  protected readonly inspectorOpen = signal(false);
  protected readonly inspectorMode = signal<'single' | 'bulk'>('single');
  protected readonly inspectorFocus = signal<'all' | 'scope' | 'review'>('all');
  protected readonly activeGroupId = signal<string | null>(null);
  protected readonly draftUnitGroups = signal<readonly string[]>([]);
  protected readonly draftTeamId = signal('');
  protected readonly draftReviewerId = signal('');

  protected readonly planByGroup = computed(
    () => new Map((this.workbench()?.plans ?? []).map((plan) => [plan.groupId, plan])),
  );

  protected readonly activeGroup = computed(
    () => this.catalog()?.groups.find((group) => group.id === this.activeGroupId()) ?? null,
  );

  protected readonly selectedTeam = computed(() =>
    this.workbench()?.teams.find((team) => team.id === this.draftTeamId()),
  );

  protected readonly teamDirectory = computed(() => {
    const workbench = this.workbench();
    const catalog = this.catalog();
    return workbench && catalog ? buildTeamDirectory(workbench, catalog) : null;
  });

  protected readonly selectedTeamRoster = computed(() =>
    this.teamDirectory()?.teams.find((team) => team.id === this.draftTeamId()),
  );

  protected readonly selectedReviewerRoster = computed(() =>
    this.teamDirectory()?.members.find((member) => member.id === this.draftReviewerId()),
  );

  protected readonly teamReviewers = computed(() =>
    (this.workbench()?.reviewers ?? []).filter(
      (reviewer) => reviewer.teamId === this.draftTeamId(),
    ),
  );

  protected readonly availableReviewers = computed(() =>
    this.teamReviewers().filter((reviewer) => reviewer.enabled),
  );

  protected readonly lockedDraftReviewer = computed(() =>
    this.teamReviewers().find(
      (reviewer) => reviewer.id === this.draftReviewerId() && !reviewer.enabled,
    ),
  );

  private readonly sectionRows = computed<readonly ScorecardGroupRow[]>(() =>
    scorecardGroupRows(this.catalog(), this.query(), this.section()),
  );

  protected readonly rows = computed<readonly ScorecardGroupRow[]>(() =>
    this.sectionRows().filter((row) => this.matchesStatus(this.plan(row.groupId), this.status())),
  );

  protected readonly statusCounts = computed(() => {
    const rows = scorecardGroupRows(this.catalog(), this.query(), this.section());
    return {
      ALL: rows.length,
      UNALLOCATED: rows.filter((row) => this.matchesStatus(this.plan(row.groupId), 'UNALLOCATED'))
        .length,
      UNASSIGNED: rows.filter((row) => this.matchesStatus(this.plan(row.groupId), 'UNASSIGNED'))
        .length,
      READY: rows.filter((row) => this.matchesStatus(this.plan(row.groupId), 'READY')).length,
    } satisfies Record<AssignmentStatusFilter, number>;
  });

  protected readonly visibleRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.rows().slice(start, start + this.pageSize);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / this.pageSize)),
  );

  protected readonly sectionCounts = computed(() => {
    const groups = this.catalog()?.groups ?? [];
    return {
      ALL: groups.length,
      CORE: groups.filter((group) => group.section === 'CORE').length,
      BONUS: groups.filter((group) => group.section === 'BONUS').length,
    } satisfies Record<ScorecardSection, number>;
  });

  protected readonly totalUnits = computed(() =>
    (this.catalog()?.unitGroups ?? []).reduce(
      (total, group) => total + group.documentedUnitCount,
      0,
    ),
  );

  protected readonly pageStart = computed(() =>
    this.rows().length ? (this.page() - 1) * this.pageSize + 1 : 0,
  );

  protected readonly pageEnd = computed(() =>
    Math.min(this.page() * this.pageSize, this.rows().length),
  );

  protected readonly allVisibleSelected = computed(
    () =>
      !!this.visibleRows().length &&
      this.visibleRows().every((row) => this.selectedGroups().includes(row.groupId)),
  );

  async ngOnInit(): Promise<void> {
    try {
      const [catalog, workbench] = await Promise.all([
        firstValueFrom(this.http.get<ScorecardCatalog>('/api/scorecards/current')),
        firstValueFrom(this.http.get<AssignmentWorkbench>('/api/assignments/current')),
      ]);
      this.catalog.set(catalog);
      this.workbench.set(workbench);
    } catch {
      this.error.set(
        'Không đọc được bảng điểm nguồn. Vui lòng kiểm tra phiên đăng nhập và backend.',
      );
    }
  }

  protected setQuery(event: Event): void {
    this.query.set(targetValue(event));
    this.page.set(1);
  }

  protected setSection(value: ScorecardSection): void {
    this.section.set(value);
    this.page.set(1);
  }

  protected setStatus(event: Event): void {
    const value = targetValue(event);
    if (value !== 'ALL' && value !== 'UNALLOCATED' && value !== 'UNASSIGNED' && value !== 'READY') {
      return;
    }
    this.status.set(value);
    this.page.set(1);
  }

  protected phaseLabel(phase: CampaignPhase): string {
    return campaignPhaseLabel(phase);
  }

  protected plan(groupId: string): AssignmentPlan | undefined {
    return this.planByGroup().get(groupId);
  }

  protected isReady(groupId: string): boolean {
    return assignmentIsReady(this.plan(groupId));
  }

  private matchesStatus(plan: AssignmentPlan | undefined, status: AssignmentStatusFilter): boolean {
    if (status === 'ALL') return true;
    const allocated = !!plan?.unitGroupCodes.length;
    const assigned = !!plan?.teamId && !!plan.reviewerId;
    if (status === 'UNALLOCATED') return !allocated;
    if (status === 'UNASSIGNED') return allocated && !assigned;
    return allocated && assigned;
  }

  protected isSelected(groupId: string): boolean {
    return this.selectedGroups().includes(groupId);
  }

  protected toggleSelected(groupId: string): void {
    this.selectedGroups.update((selected) =>
      selected.includes(groupId) ? selected.filter((id) => id !== groupId) : [...selected, groupId],
    );
  }

  protected toggleVisibleSelection(): void {
    const visibleIds = this.visibleRows().map((row) => row.groupId);
    this.selectedGroups.update((selected) =>
      this.allVisibleSelected()
        ? selected.filter((id) => !visibleIds.includes(id))
        : [...new Set([...selected, ...visibleIds])],
    );
  }

  protected openGroup(groupId: string): void {
    const plan = this.plan(groupId);
    this.inspectorMode.set('single');
    this.inspectorFocus.set('all');
    this.activeGroupId.set(groupId);
    this.draftUnitGroups.set(plan?.unitGroupCodes ?? []);
    this.draftTeamId.set(plan?.teamId ?? '');
    this.draftReviewerId.set(plan?.reviewerId ?? '');
    this.notice.set('');
    this.inspectorOpen.set(true);
  }

  protected openBulk(focus: 'scope' | 'review'): void {
    if (!this.selectedGroups().length) return;
    this.inspectorMode.set('bulk');
    this.inspectorFocus.set(focus);
    this.activeGroupId.set(null);
    this.draftUnitGroups.set([]);
    this.draftTeamId.set('');
    this.draftReviewerId.set('');
    this.notice.set('');
    this.inspectorOpen.set(true);
  }

  protected setPage(page: number): void {
    this.page.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  protected unitGroupLabel(plan: AssignmentPlan | undefined): string {
    const codes = plan?.unitGroupCodes ?? [];
    if (!codes.length) return 'Chưa phân bổ';
    if (codes.length > 1) return `${codes.length} khối`;
    return this.workbench()?.unitGroups.find((group) => group.code === codes[0])?.name ?? '1 khối';
  }

  protected reviewerLabel(plan: AssignmentPlan | undefined): string {
    if (!plan?.reviewerId) return 'Chưa phân công';
    return (
      this.workbench()?.reviewers.find((reviewer) => reviewer.id === plan.reviewerId)
        ?.displayName ?? 'Chưa phân công'
    );
  }

  protected teamLabel(plan: AssignmentPlan | undefined): string {
    if (!plan?.teamId) return 'Chưa chọn tổ';
    return this.workbench()?.teams.find((team) => team.id === plan.teamId)?.name ?? 'Tổ theo dõi';
  }

  protected closeInspector(): void {
    this.inspectorOpen.set(false);
  }

  protected toggleUnitGroup(code: string): void {
    this.draftUnitGroups.update((values) =>
      values.includes(code) ? values.filter((value) => value !== code) : [...values, code],
    );
  }

  protected setTeam(event: Event): void {
    const teamId = targetValue(event);
    this.draftTeamId.set(teamId);
    if (!this.availableReviewers().some((reviewer) => reviewer.id === this.draftReviewerId())) {
      this.draftReviewerId.set('');
    }
  }

  protected async saveAssignment(): Promise<void> {
    const workbench = this.workbench();
    if (!workbench || this.saving()) return;
    this.saving.set(true);
    this.notice.set('');
    try {
      const common = {
        unitGroupCodes: this.draftUnitGroups(),
        teamId: this.draftTeamId() || null,
        reviewerId: this.draftReviewerId() || null,
      };
      const updated =
        this.inspectorMode() === 'bulk'
          ? await firstValueFrom(
              this.http.put<AssignmentWorkbench>('/api/assignments/current/bulk', {
                ...common,
                mode: this.inspectorFocus().toUpperCase(),
                groups: this.selectedGroups().map((groupId) => ({
                  groupId,
                  expectedVersion: this.plan(groupId)?.version ?? 0,
                })),
              }),
            )
          : await firstValueFrom(
              this.http.put<AssignmentWorkbench>(
                `/api/assignments/current/groups/${encodeURIComponent(this.activeGroupId() ?? '')}`,
                {
                  ...common,
                  expectedVersion: this.plan(this.activeGroupId() ?? '')?.version ?? 0,
                },
              ),
            );
      this.workbench.set(updated);
      this.selectedGroups.set([]);
      this.inspectorOpen.set(false);
      this.notice.set(
        this.inspectorFocus() === 'scope'
          ? 'Đã lưu phạm vi áp dụng.'
          : this.inspectorFocus() === 'review'
            ? 'Đã lưu người chấm.'
            : 'Đã lưu phạm vi và người chấm.',
      );
    } catch (error) {
      this.notice.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể lưu phân công.')
          : 'Không thể lưu phân công.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected async advance(): Promise<void> {
    const workbench = this.workbench();
    if (!workbench || this.saving()) return;
    const endpoint = advanceEndpoint(workbench.phase);
    if (endpoint === undefined) return;
    this.saving.set(true);
    this.notice.set('');
    try {
      this.workbench.set(
        await firstValueFrom(
          this.http.post<AssignmentWorkbench>(
            `/api/assignments/current/${endpoint}`,
            {
              expectedVersion: workbench.campaignVersion,
            },
            { headers: { 'Idempotency-Key': crypto.randomUUID() } },
          ),
        ),
      );
      const notices = {
        release: 'Đã ban hành bảng phân công.',
        'start-review': 'Đã mở vòng thẩm định thứ nhất.',
        'open-explanation': 'Đã khóa điểm vòng 1 và mở thời gian giải trình.',
        'start-round-two': 'Đã khóa giải trình và mở vòng thẩm định thứ hai.',
      } satisfies Record<AdvanceEndpoint, string>;
      this.notice.set(notices[endpoint]);
    } catch (error) {
      this.notice.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể chuyển giai đoạn.')
          : 'Không thể chuyển giai đoạn.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
