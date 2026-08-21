import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type {
  AssignmentWorkbench,
  ReviewControl,
  ReviewControlCase,
  ReviewControlCriterion,
  ReviewControlCriterionCases,
} from '../../api/models';
import { problemDetail } from '../../core/problem-detail';
import { AppIconComponent } from '../../shared/app-icon.component';
import { targetValue } from '../../shared/form-events';

type CaseFilter = 'all' | 'missing' | 'pending' | 'completed' | 'reduced';

@Component({
  selector: 'app-review-control-page',
  imports: [RouterLink, AppIconComponent, DatePipe],
  templateUrl: './review-control.page.html',
  styleUrls: ['./review-control.page.css', './review-control-dossier.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewControlPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly view = signal<ReviewControl | null>(null);
  protected readonly criterionCases = signal<ReviewControlCriterionCases | null>(null);
  protected readonly selectedCaseId = signal<string | null>(null);
  protected readonly caseFilter = signal<CaseFilter>('all');
  protected readonly caseSearch = signal('');
  protected readonly detailLoading = signal(false);
  protected readonly message = signal('');
  protected readonly busy = signal(false);
  protected readonly showAllAssessors = signal(false);
  protected readonly visibleAssessors = computed(() => {
    const assessors = this.view()?.assessors ?? [];
    return this.showAllAssessors() ? assessors : assessors.slice(0, 5);
  });
  protected readonly resultRoute = this.router.url.startsWith('/superadmin')
    ? '/superadmin/results'
    : '/admin/results';
  protected readonly filteredCases = computed(() => {
    const query = this.caseSearch().trim().toLocaleLowerCase('vi');
    return (this.criterionCases()?.cases ?? []).filter((item) => {
      const matchesQuery =
        !query ||
        `${item.organizationName} ${item.lineCode} ${item.lineTitle}`
          .toLocaleLowerCase('vi')
          .includes(query);
      const matchesFilter =
        this.caseFilter() === 'all' ||
        (this.caseFilter() === 'missing' && item.reviewStatus === 'NOT_SUBMITTED') ||
        (this.caseFilter() === 'pending' &&
          item.reviewStatus !== 'NOT_SUBMITTED' &&
          item.reviewStatus !== 'COMPLETED') ||
        (this.caseFilter() === 'completed' && item.reviewStatus === 'COMPLETED') ||
        (this.caseFilter() === 'reduced' &&
          item.awardedScore !== null &&
          item.selfScore !== null &&
          item.awardedScore < item.selfScore);
      return matchesQuery && matchesFilter;
    });
  });
  protected readonly selectedCase = computed(() => {
    const cases = this.criterionCases()?.cases ?? [];
    return cases.find((item) => this.caseKey(item) === this.selectedCaseId()) ?? cases[0] ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
    const groupId = this.route.snapshot.queryParamMap.get('criterion');
    const criterion = this.view()?.criteria.find((item) => item.groupId === groupId);
    if (criterion) await this.openCriterion(criterion, false);
  }

  protected percent(value: number): number {
    return Math.round(value * 100);
  }

  protected async openCriterion(
    criterion: ReviewControlCriterion,
    updateUrl = true,
  ): Promise<void> {
    if (this.detailLoading()) return;
    this.detailLoading.set(true);
    this.message.set('');
    this.criterionCases.set(null);
    this.selectedCaseId.set(null);
    this.caseFilter.set('all');
    this.caseSearch.set('');
    try {
      const detail = await firstValueFrom(
        this.http.get<ReviewControlCriterionCases>(
          `/api/admin/review-control/criteria/${encodeURIComponent(criterion.groupId)}/cases`,
        ),
      );
      this.criterionCases.set(detail);
      this.selectedCaseId.set(detail.cases[0] ? this.caseKey(detail.cases[0]) : null);
      if (updateUrl) {
        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { criterion: criterion.groupId },
          queryParamsHandling: 'merge',
        });
      }
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Chưa thể đọc hồ sơ của tiêu chí.')
          : 'Chưa thể đọc hồ sơ của tiêu chí.',
      );
    } finally {
      this.detailLoading.set(false);
    }
  }

  protected async closeCriterion(): Promise<void> {
    this.criterionCases.set(null);
    this.selectedCaseId.set(null);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { criterion: null },
      queryParamsHandling: 'merge',
    });
  }

  protected selectCase(item: ReviewControlCase): void {
    this.selectedCaseId.set(this.caseKey(item));
  }

  protected setCaseFilter(filter: CaseFilter): void {
    this.caseFilter.set(filter);
    this.selectedCaseId.set(null);
  }

  protected setCaseSearch(event: Event): void {
    this.caseSearch.set(targetValue(event));
    this.selectedCaseId.set(null);
  }

  protected caseKey(item: ReviewControlCase): string {
    return item.caseId ?? `${item.organizationId}:${item.lineId}`;
  }

  protected statusLabel(item: ReviewControlCase): string {
    if (item.reviewStatus === 'NOT_SUBMITTED') return 'Chưa gửi hồ sơ';
    if (item.reviewStatus === 'WAITING_FOR_REVIEW') return 'Chờ tạo lượt chấm';
    if (item.reviewStatus === 'COMPLETED') return 'Đã chấm';
    if (item.reviewStatus === 'IN_PROGRESS') return 'Đang chấm';
    if (item.reviewStatus === 'WAITING_FOR_SUBMISSION') return 'Chờ đơn vị bổ sung';
    return 'Chờ chấm';
  }

  protected evidenceHost(url: string | null): string {
    if (!url) return '';
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  protected isReduced(item: ReviewControlCase): boolean {
    return (
      item.awardedScore !== null && item.selfScore !== null && item.awardedScore < item.selfScore
    );
  }

  protected async openExplanation(): Promise<void> {
    const data = this.view();
    if (!data?.canOpenExplanation || this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      await firstValueFrom(
        this.http.post<AssignmentWorkbench>(
          '/api/assignments/current/open-explanation',
          { expectedVersion: data.campaignVersion },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      await this.load();
      this.message.set('Đã khóa vòng 1 và mở giải trình cho các tiêu chí bị giảm điểm.');
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Chưa thể khóa vòng 1 và mở giải trình.')
          : 'Chưa thể khóa vòng 1 và mở giải trình.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.view.set(
        await firstValueFrom(this.http.get<ReviewControl>('/api/admin/review-control')),
      );
    } catch {
      this.message.set('Không đọc được tiến độ thẩm định.');
    }
  }
}
