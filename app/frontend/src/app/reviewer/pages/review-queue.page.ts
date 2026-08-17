import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { problemDetail } from '../../core/problem-detail';
import { CampaignPhase } from '../../shared/domain-types';
import { targetChecked, targetValue } from '../../shared/form-events';

interface ReviewCase {
  readonly id: string;
  readonly organizationName: string;
  readonly groupCode: string;
  readonly lineCode: string;
  readonly lineTitle: string;
  readonly maximumScore: number;
  readonly selfScore: number;
  readonly evidenceUrl: string;
  readonly summary: string;
  readonly roundNumber: number;
  readonly status: string;
  readonly version: number;
  readonly awardedScore: number | null;
  readonly reason: string | null;
  readonly evidenceChecked: boolean;
  readonly decidedByName: string | null;
  readonly decidedAt: string | null;
  readonly roundOneScore: number | null;
  readonly roundOneReason: string | null;
  readonly explanationBody: string | null;
  readonly explanationEvidenceUrl: string | null;
  readonly explanationRevision: number;
}

interface QueueView {
  readonly campaignName: string;
  readonly phase: CampaignPhase;
  readonly teamName: string;
  readonly cases: readonly ReviewCase[];
}

interface DecisionDraft {
  awardedScore: number | null;
  evidenceChecked: boolean;
  reason: string;
}

@Component({
  selector: 'app-review-queue-page',
  templateUrl: './review-queue.page.html',
  styleUrl: './review-queue.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly view = signal<QueueView | null>(null);
  protected readonly drafts = signal<Record<string, DecisionDraft>>({});
  protected readonly message = signal('');
  protected readonly busyCase = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.http.get<QueueView>('/api/reviewer/queue')));
    } catch {
      this.message.set('Không đọc được hàng chờ thẩm định.');
    }
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
    const phaseMatches =
      (item.roundNumber === 1 && this.view()?.phase === 'ROUND_1') ||
      (item.roundNumber === 2 && this.view()?.phase === 'ROUND_2');
    return phaseMatches && ['QUEUED', 'IN_PROGRESS'].includes(item.status);
  }

  protected setScore(item: ReviewCase, event: Event): void {
    const value = targetValue(event);
    this.patch(item, { awardedScore: value === '' ? null : Number(value) });
  }

  protected setChecked(item: ReviewCase, event: Event): void {
    this.patch(item, { evidenceChecked: targetChecked(event) });
  }

  protected setReason(item: ReviewCase, event: Event): void {
    this.patch(item, { reason: targetValue(event) });
  }

  protected async complete(item: ReviewCase): Promise<void> {
    if (this.busyCase()) return;
    this.busyCase.set(item.id);
    this.message.set('');
    try {
      const updated = await firstValueFrom(
        this.http.post<QueueView>(
          `/api/reviewer/queue/${encodeURIComponent(item.id)}/${item.roundNumber === 1 ? 'round-one' : 'round-two'}`,
          {
            ...this.draft(item),
            expectedVersion: item.version,
          },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã ghi kết quả vòng ${item.roundNumber} dòng ${item.lineCode}.`);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể ghi kết quả thẩm định.')
          : 'Không thể ghi kết quả thẩm định.',
      );
    } finally {
      this.busyCase.set(null);
    }
  }

  protected async returnToUnit(item: ReviewCase): Promise<void> {
    if (this.busyCase() || item.roundNumber !== 1) return;
    this.busyCase.set(item.id);
    this.message.set('');
    try {
      const updated = await firstValueFrom(
        this.http.post<QueueView>(
          `/api/reviewer/queue/${encodeURIComponent(item.id)}/return`,
          { reason: this.draft(item).reason, expectedVersion: item.version },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã trả dòng ${item.lineCode}; đơn vị nhìn thấy ngay lý do cần bổ sung.`);
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

  private apply(view: QueueView): void {
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
