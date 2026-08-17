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
import { firstValueFrom } from 'rxjs';
import { problemDetail } from '../../core/problem-detail';
import { CampaignPhase, EvidencePolicy } from '../../shared/domain-types';
import { targetValue } from '../../shared/form-events';

interface ScorecardLine {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly requirement: string;
  readonly evidenceHint: string;
  readonly reportTemplate: string;
  readonly evidencePolicy: EvidencePolicy;
  readonly maximumScore: number;
  readonly sourceSheet: string;
  readonly sourceRow: number;
}

interface ScorecardGroup {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly section: 'CORE' | 'BONUS';
  readonly lines: readonly ScorecardLine[];
}

interface ScorecardCatalog {
  readonly id: string;
  readonly campaignName: string;
  readonly title: string;
  readonly audience: string;
  readonly status: string;
  readonly source: {
    readonly fileName: string;
    readonly sha256: string;
    readonly receivedScope: string;
  };
  readonly policy: {
    readonly coreMaximum: number;
    readonly bonusRawMaximum: number;
    readonly bonusCap: number;
    readonly overallMaximum: number;
    readonly groupCount: number;
    readonly lineCount: number;
  };
  readonly unitGroups: readonly {
    readonly code: string;
    readonly name: string;
    readonly documentedUnitCount: number;
  }[];
  readonly groups: readonly ScorecardGroup[];
}

interface TableRow {
  readonly groupId: string;
  readonly groupCode: string;
  readonly groupTitle: string;
  readonly section: 'CORE' | 'BONUS';
  readonly firstInGroup: boolean;
  readonly visibleLineCount: number;
  readonly line: ScorecardLine;
}

interface AssignmentPlan {
  readonly groupId: string;
  readonly unitGroupCodes: readonly string[];
  readonly teamId: string | null;
  readonly reviewerId: string | null;
  readonly version: number;
  readonly expectedTasks: number;
  readonly submittedTasks: number;
  readonly reviewedTasks: number;
  readonly lastReviewedBy: string | null;
  readonly lastReviewedAt: string | null;
}

interface AssignmentWorkbench {
  readonly campaignId: string;
  readonly campaignName: string;
  readonly phase: CampaignPhase;
  readonly campaignVersion: number;
  readonly scorecardStatus: string;
  readonly unitGroups: readonly { code: string; name: string; documentedUnitCount: number }[];
  readonly teams: readonly { id: string; name: string }[];
  readonly reviewers: readonly { id: string; displayName: string; teamId: string }[];
  readonly plans: readonly AssignmentPlan[];
  readonly progress: {
    readonly totalGroups: number;
    readonly readyGroups: number;
    readonly expectedTasks: number;
    readonly submittedTasks: number;
    readonly reviewedTasks: number;
  };
}

type AdvanceEndpoint = 'release' | 'start-review' | 'publish-round-one' | 'start-round-two';

/** Chỉ bốn giai đoạn đầu có lệnh chuyển tiếp tương ứng. */
const ADVANCE_ENDPOINTS = new Map<CampaignPhase, AdvanceEndpoint>([
  ['PREPARATION', 'release'],
  ['SELF_ASSESSMENT', 'start-review'],
  ['ROUND_1', 'publish-round-one'],
  ['EXPLANATION', 'start-round-two'],
]);

const PHASE_LABELS = new Map<CampaignPhase, string>([
  ['PREPARATION', 'Đang cấu hình'],
  ['SELF_ASSESSMENT', 'Đơn vị đang nhập'],
  ['ROUND_1', 'Đang thẩm định vòng 1'],
  ['EXPLANATION', 'Đang giải trình'],
  ['ROUND_2', 'Đang thẩm định vòng 2'],
  ['PUBLISHED', 'Đã công bố'],
]);

@Component({
  selector: 'app-scorecard-catalog-page',
  imports: [FormsModule],
  templateUrl: './scorecard-catalog.page.html',
  styleUrls: ['./scorecard-catalog.page.css', './scorecard-inspector.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorecardCatalogPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly catalog = signal<ScorecardCatalog | null>(null);
  protected readonly workbench = signal<AssignmentWorkbench | null>(null);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly saving = signal(false);
  protected readonly query = signal('');
  protected readonly section = signal<'ALL' | 'CORE' | 'BONUS'>('ALL');
  protected readonly sourceOpen = signal(false);
  protected readonly selectedGroups = signal<readonly string[]>([]);
  protected readonly inspectorOpen = signal(false);
  protected readonly inspectorMode = signal<'single' | 'bulk'>('single');
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

  protected readonly availableReviewers = computed(() =>
    (this.workbench()?.reviewers ?? []).filter(
      (reviewer) => !this.draftTeamId() || reviewer.teamId === this.draftTeamId(),
    ),
  );

  protected readonly rows = computed<readonly TableRow[]>(() => {
    const catalog = this.catalog();
    if (!catalog) return [];
    const query = this.query().trim().toLocaleLowerCase('vi');
    return catalog.groups
      .filter((group) => this.section() === 'ALL' || group.section === this.section())
      .flatMap((group) => {
        const visibleLines = group.lines.filter((line) =>
          !query
            ? true
            : `${group.code} ${group.title} ${line.code} ${line.title} ${line.requirement}`
                .toLocaleLowerCase('vi')
                .includes(query),
        );
        return visibleLines.map((line, index) => ({
          groupId: group.id,
          groupCode: group.code,
          groupTitle: group.title,
          section: group.section,
          firstInGroup: index === 0,
          visibleLineCount: visibleLines.length,
          line,
        }));
      });
  });

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
  }

  protected setSection(event: Event): void {
    const value = targetValue(event);
    if (value === 'ALL' || value === 'CORE' || value === 'BONUS') {
      this.section.set(value);
    }
  }

  protected evidenceLabel(policy: EvidencePolicy): string {
    const labels = {
      LINK: 'Nhập liên kết',
      DOCUMENT: 'Văn bản/danh sách',
      INTERNAL: 'Tổ chủ động theo dõi',
      GUIDED: 'Theo hướng dẫn',
    } satisfies Record<EvidencePolicy, string>;
    return labels[policy] ?? policy;
  }

  protected phaseLabel(phase: CampaignPhase): string {
    return PHASE_LABELS.get(phase) ?? phase;
  }

  protected plan(groupId: string): AssignmentPlan | undefined {
    return this.planByGroup().get(groupId);
  }

  protected isReady(groupId: string): boolean {
    const plan = this.plan(groupId);
    return !!plan?.unitGroupCodes.length && !!plan.teamId && !!plan.reviewerId;
  }

  protected isSelected(groupId: string): boolean {
    return this.selectedGroups().includes(groupId);
  }

  protected toggleSelected(groupId: string): void {
    this.selectedGroups.update((selected) =>
      selected.includes(groupId) ? selected.filter((id) => id !== groupId) : [...selected, groupId],
    );
  }

  protected openGroup(groupId: string): void {
    const plan = this.plan(groupId);
    this.inspectorMode.set('single');
    this.activeGroupId.set(groupId);
    this.draftUnitGroups.set(plan?.unitGroupCodes ?? []);
    this.draftTeamId.set(plan?.teamId ?? '');
    this.draftReviewerId.set(plan?.reviewerId ?? '');
    this.notice.set('');
    this.inspectorOpen.set(true);
  }

  protected openBulk(): void {
    if (!this.selectedGroups().length) return;
    this.inspectorMode.set('bulk');
    this.activeGroupId.set(null);
    this.draftUnitGroups.set([]);
    this.draftTeamId.set('');
    this.draftReviewerId.set('');
    this.notice.set('');
    this.inspectorOpen.set(true);
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
      this.notice.set('Đã lưu phạm vi và người thẩm định.');
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
    const endpoint = ADVANCE_ENDPOINTS.get(workbench.phase);
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
        'publish-round-one': 'Đã khóa điểm vòng 1 và mở thời gian giải trình.',
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
