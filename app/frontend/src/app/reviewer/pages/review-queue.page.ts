import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { ReviewCase, ReviewCriterionProgress, ReviewQueue } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';
import { AppIconComponent } from '../../shared/app-icon.component';
import { targetChecked, targetValue } from '../../shared/form-events';

type CriterionTab = 'pending' | 'completed' | 'adjusted' | 'recheck';
type CaseTab = 'pending' | 'completed' | 'adjusted';

interface DecisionDraft {
  awardedScore: number | null;
  evidenceChecked: boolean;
  reason: string;
}

function criterionTab(value: string | undefined): CriterionTab {
  return value === 'completed' || value === 'adjusted' || value === 'recheck' ? value : 'pending';
}

@Component({
  selector: 'app-review-queue-page',
  imports: [AppIconComponent],
  templateUrl: './review-queue.page.html',
  styleUrl: './review-queue.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly view = signal<ReviewQueue | null>(null);
  protected readonly drafts = signal<Record<string, DecisionDraft>>({});
  protected readonly message = signal('');
  protected readonly busyCase = signal<string | null>(null);
  protected readonly activeTab = signal<CriterionTab>(
    criterionTab(this.route.snapshot.data['criterionTab']),
  );
  protected readonly caseTab = signal<CaseTab>('pending');
  protected readonly search = signal('');
  protected readonly caseSearch = signal('');
  protected readonly selectedGroupId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('criterion'),
  );
  protected readonly selectedCaseId = signal<string | null>(null);
  protected readonly inspectorDismissed = signal(false);

  protected readonly selectedCriterion = computed(() =>
    this.view()?.criteria.find((item) => item.groupId === this.selectedGroupId()),
  );
  protected readonly totalExpected = computed(() =>
    (this.view()?.criteria ?? []).reduce((total, item) => total + item.expectedCases, 0),
  );
  protected readonly filteredCriteria = computed(() => {
    const query = this.search().trim().toLocaleLowerCase('vi');
    return (this.view()?.criteria ?? []).filter((item) => {
      const matchesQuery =
        !query || `${item.code} ${item.title}`.toLocaleLowerCase('vi').includes(query);
      const remaining = Math.max(0, item.expectedCases - item.completedCases);
      const matchesTab =
        this.activeTab() === 'pending'
          ? remaining > 0
          : this.activeTab() === 'completed'
            ? item.expectedCases > 0 && remaining === 0
            : this.activeTab() === 'adjusted'
              ? item.adjustedCases > 0
              : item.returnedCases > 0 ||
                (this.view()?.phase === 'ROUND_2' && item.submittedCases > item.completedCases);
      return matchesQuery && matchesTab;
    });
  });
  protected readonly criterionCases = computed(() => {
    const criterion = this.selectedCriterion();
    if (!criterion) return [];
    const query = this.caseSearch().trim().toLocaleLowerCase('vi');
    return (this.view()?.cases ?? []).filter((item) => {
      const matchesCriterion = item.groupCode === criterion.code;
      const matchesQuery =
        !query ||
        `${item.organizationName} ${item.lineCode} ${item.lineTitle}`
          .toLocaleLowerCase('vi')
          .includes(query);
      const matchesTab =
        this.caseTab() === 'pending'
          ? item.status !== 'COMPLETED'
          : this.caseTab() === 'completed'
            ? item.status === 'COMPLETED'
            : item.awardedScore !== null &&
              item.awardedScore !== undefined &&
              item.awardedScore < item.selfScore;
      return matchesCriterion && matchesQuery && matchesTab;
    });
  });
  protected readonly selectedCase = computed(() => {
    if (this.inspectorDismissed()) return null;
    const cases = this.criterionCases();
    return cases.find((item) => item.id === this.selectedCaseId()) ?? cases[0];
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected setCriterionTab(tab: CriterionTab): void {
    this.activeTab.set(tab);
  }

  protected setCaseTab(tab: CaseTab): void {
    this.caseTab.set(tab);
    this.selectedCaseId.set(null);
    this.inspectorDismissed.set(false);
  }

  protected setSearch(event: Event): void {
    this.search.set(targetValue(event));
  }

  protected setCaseSearch(event: Event): void {
    this.caseSearch.set(targetValue(event));
  }

  protected async openCriterion(item: ReviewCriterionProgress): Promise<void> {
    this.selectedGroupId.set(item.groupId);
    this.selectedCaseId.set(null);
    this.inspectorDismissed.set(false);
    this.caseTab.set('pending');
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { criterion: item.groupId },
      queryParamsHandling: 'merge',
    });
  }

  protected async closeCriterion(): Promise<void> {
    this.selectedGroupId.set(null);
    this.selectedCaseId.set(null);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { criterion: null },
      queryParamsHandling: 'merge',
    });
  }

  protected selectCase(item: ReviewCase): void {
    this.selectedCaseId.set(item.id);
    this.inspectorDismissed.set(false);
  }

  protected closeCase(): void {
    this.inspectorDismissed.set(true);
  }

  protected draft(item: ReviewCase): DecisionDraft {
    return (
      this.drafts()[item.id] ?? {
        awardedScore: item.awardedScore ?? item.selfScore,
        evidenceChecked: item.evidenceChecked,
        reason: item.reason ?? '',
      }
    );
  }

  protected editable(item: ReviewCase): boolean {
    const phase = this.view()?.phase;
    const activeRound =
      (phase === 'ROUND_1' && item.roundNumber === 1) ||
      (phase === 'ROUND_2' && item.roundNumber === 2);
    return activeRound && item.status !== 'COMPLETED';
  }

  protected setScore(item: ReviewCase, event: Event): void {
    const value = targetValue(event);
    this.patch(item, { awardedScore: value === '' ? null : Number(value) });
  }

  protected setReason(item: ReviewCase, event: Event): void {
    this.patch(item, { reason: targetValue(event) });
  }

  protected setChecked(item: ReviewCase, event: Event): void {
    this.patch(item, { evidenceChecked: targetChecked(event) });
  }

  protected remaining(item: ReviewCriterionProgress): number {
    return Math.max(0, item.expectedCases - item.completedCases);
  }

  protected percent(item: ReviewCriterionProgress): number {
    return item.expectedCases === 0
      ? 0
      : Math.round((item.completedCases / item.expectedCases) * 100);
  }

  protected countFor(tab: CriterionTab): number {
    const criteria = this.view()?.criteria ?? [];
    return criteria.filter((item) => {
      const remaining = this.remaining(item);
      if (tab === 'pending') return remaining > 0;
      if (tab === 'completed') return item.expectedCases > 0 && remaining === 0;
      if (tab === 'adjusted') return item.adjustedCases > 0;
      return (
        item.returnedCases > 0 ||
        (this.view()?.phase === 'ROUND_2' && item.submittedCases > item.completedCases)
      );
    }).length;
  }

  protected caseCount(tab: CaseTab): number {
    const criterion = this.selectedCriterion();
    if (!criterion) return 0;
    const cases = (this.view()?.cases ?? []).filter((item) => item.groupCode === criterion.code);
    if (tab === 'pending') return cases.filter((item) => item.status !== 'COMPLETED').length;
    if (tab === 'completed') return cases.filter((item) => item.status === 'COMPLETED').length;
    return cases.filter(
      (item) =>
        item.awardedScore !== null &&
        item.awardedScore !== undefined &&
        item.awardedScore < item.selfScore,
    ).length;
  }

  protected async complete(item: ReviewCase): Promise<void> {
    if (this.busyCase() || !this.editable(item)) return;
    const draft = this.draft(item);
    if (draft.awardedScore === null) {
      this.message.set('Cần nhập điểm thẩm định trước khi chốt.');
      return;
    }
    this.busyCase.set(item.id);
    this.message.set('');
    try {
      const endpoint = item.roundNumber === 1 ? 'round-one' : 'round-two';
      const updated = await firstValueFrom(
        this.http.post<ReviewQueue>(
          `/api/reviewer/queue/${encodeURIComponent(item.id)}/${endpoint}`,
          { ...draft, expectedVersion: item.version },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã chốt ${item.lineCode} của ${item.organizationName}.`);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể chốt điểm.')
          : 'Không thể chốt điểm.',
      );
    } finally {
      this.busyCase.set(null);
    }
  }

  protected async returnToUnit(item: ReviewCase): Promise<void> {
    if (this.busyCase() || item.roundNumber !== 1 || !this.editable(item)) return;
    if (!this.draft(item).reason.trim()) {
      this.message.set('Cần ghi rõ nội dung đơn vị phải bổ sung.');
      return;
    }
    this.busyCase.set(item.id);
    this.message.set('');
    try {
      const updated = await firstValueFrom(
        this.http.post<ReviewQueue>(
          `/api/reviewer/queue/${encodeURIComponent(item.id)}/return`,
          { reason: this.draft(item).reason, expectedVersion: item.version },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã trả ${item.lineCode} cho ${item.organizationName} bổ sung.`);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể trả hồ sơ.')
          : 'Không thể trả hồ sơ.',
      );
    } finally {
      this.busyCase.set(null);
    }
  }

  private async load(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.http.get<ReviewQueue>('/api/reviewer/queue')));
    } catch {
      this.message.set('Không đọc được công việc chấm.');
    }
  }

  private apply(view: ReviewQueue): void {
    this.view.set(view);
    this.drafts.set(
      Object.fromEntries(
        view.cases.map((item) => [
          item.id,
          {
            awardedScore: item.awardedScore ?? item.selfScore,
            evidenceChecked: item.evidenceChecked,
            reason: item.reason ?? '',
          },
        ]),
      ),
    );
  }

  private patch(item: ReviewCase, patch: Partial<DecisionDraft>): void {
    this.drafts.update((values) => ({ ...values, [item.id]: { ...this.draft(item), ...patch } }));
  }
}
