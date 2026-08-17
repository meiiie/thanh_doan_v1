import { DOCUMENT, PercentPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { problemDetail } from '../../core/problem-detail';
import { CampaignPhase } from '../../shared/domain-types';

type ResultStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED';

/** Trang này chỉ cần nhãn cho các giai đoạn gần cuối vòng đời. */
const PHASE_LABELS = new Map<CampaignPhase, string>([
  ['ROUND_2', 'Thẩm định vòng 2'],
  ['FINAL_REVIEW', 'Chốt kết quả'],
  ['PUBLISHED', 'Đã công bố'],
]);

interface UnitResult {
  readonly organizationId: string;
  readonly organizationCode: string;
  readonly organizationName: string;
  readonly unitGroupCode: string;
  readonly applicableCoreMaximum: number;
  readonly coreScore: number;
  readonly bonusRawScore: number;
  readonly bonusCappedScore: number;
  readonly totalScore: number;
  readonly completionRate: number;
}

interface ResultView {
  readonly campaignName: string;
  readonly phase: CampaignPhase;
  readonly campaignVersion: number;
  readonly expectedTasks: number;
  readonly completedRoundTwo: number;
  readonly resultId: string | null;
  readonly resultVersion: number | null;
  readonly status: ResultStatus | null;
  readonly aggregateTotal: number;
  readonly checksum: string | null;
  readonly preparedBy: string | null;
  readonly preparedAt: string | null;
  readonly approvedBy: string | null;
  readonly approvedAt: string | null;
  readonly publishedBy: string | null;
  readonly publishedAt: string | null;
  readonly version: number;
  readonly units: readonly UnitResult[];
}

@Component({
  selector: 'app-final-results-page',
  imports: [PercentPipe],
  templateUrl: './final-results.page.html',
  styleUrl: './final-results.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalResultsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  protected readonly auth = inject(AuthService);
  protected readonly view = signal<ResultView | null>(null);
  protected readonly message = signal('');
  protected readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected canPrepare(data: ResultView): boolean {
    return (
      data.phase === 'ROUND_2' &&
      data.expectedTasks > 0 &&
      data.completedRoundTwo === data.expectedTasks
    );
  }

  protected isOwnSnapshot(data: ResultView): boolean {
    return data.preparedBy === this.auth.account()?.displayName;
  }

  protected statusLabel(status: ResultStatus | null): string {
    const labels = {
      PENDING_APPROVAL: 'Chờ người thứ hai duyệt',
      APPROVED: 'Đã duyệt bốn mắt',
      PUBLISHED: 'Đã công bố',
    } satisfies Record<ResultStatus, string>;
    return status ? (labels[status] ?? status) : 'Chưa lập snapshot';
  }

  protected phaseLabel(phase: CampaignPhase): string {
    return PHASE_LABELS.get(phase) ?? phase;
  }

  protected async act(action: 'prepare' | 'approve' | 'publish', data: ResultView): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    const body =
      action === 'prepare'
        ? { expectedCampaignVersion: data.campaignVersion }
        : action === 'approve'
          ? { expectedResultVersion: data.version }
          : { expectedResultVersion: data.version, expectedCampaignVersion: data.campaignVersion };
    try {
      const updated = await firstValueFrom(
        this.http.post<ResultView>(`/api/results/current/${action}`, body, {
          headers: { 'Idempotency-Key': crypto.randomUUID() },
        }),
      );
      this.view.set(updated);
      const messages = {
        prepare: 'Đã khóa dữ liệu vào snapshot; đang chờ một người khác duyệt.',
        approve: 'Đã duyệt kết quả theo nguyên tắc bốn mắt.',
        publish: 'Đã công bố snapshot kết quả cuối.',
      };
      this.message.set(messages[action]);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể thực hiện thao tác.')
          : 'Không thể thực hiện thao tác.',
      );
    } finally {
      this.busy.set(false);
    }
  }

  protected async download(data: ResultView): Promise<void> {
    if (!data.resultId || this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      const blob = await firstValueFrom(
        this.http.get('/api/results/current/export', { responseType: 'blob' }),
      );
      const url = URL.createObjectURL(blob);
      const anchor = this.document.createElement('a');
      anchor.href = url;
      anchor.download = `doi-soat-tntn-he-2026-v${data.resultVersion}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      this.message.set('Đã tạo file Excel từ đúng snapshot đang hiển thị.');
    } catch {
      this.message.set('Không thể tải file Excel đối soát.');
    } finally {
      this.busy.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.view.set(await firstValueFrom(this.http.get<ResultView>('/api/results/current')));
    } catch {
      this.message.set('Không đọc được kết quả chiến dịch.');
    }
  }
}
