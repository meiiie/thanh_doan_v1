import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CampaignPhase } from '../../shared/domain-types';

interface ReadinessItem {
  readonly code: string;
  readonly label: string;
  readonly ready: boolean;
  readonly detail: string;
}

interface CampaignStatus {
  readonly id: string;
  readonly name: string;
  readonly phase: CampaignPhase;
  readonly scorecardStatus: string;
  readonly scorecardGroups: number;
  readonly scorecardLines: number;
  readonly documentedUnitGroups: number;
  readonly documentedUnits: number;
  readonly activeAccounts: number;
  readonly submissions: number;
  readonly reviewCases: number;
  readonly finalResults: number;
  readonly readiness: readonly ReadinessItem[];
}

@Component({
  selector: 'app-campaign-status-page',
  templateUrl: './campaign-status.page.html',
  styleUrl: './campaign-status.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignStatusPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly status = signal<CampaignStatus | null>(null);
  protected readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.status.set(
        await firstValueFrom(this.http.get<CampaignStatus>('/api/campaigns/current/status')),
      );
    } catch {
      this.error.set('Không đọc được trạng thái chiến dịch từ máy chủ.');
    }
  }

  protected phaseLabel(phase: CampaignPhase): string {
    const labels = {
      PREPARATION: 'Đang chuẩn bị',
      SELF_ASSESSMENT: 'Đơn vị tự chấm',
      ROUND_1: 'Thẩm định vòng 1',
      EXPLANATION: 'Giải trình',
      ROUND_2: 'Thẩm định vòng 2',
      FINAL_REVIEW: 'Duyệt kết quả',
      PUBLISHED: 'Đã công bố',
      CLOSED: 'Đã đóng',
    } satisfies Record<CampaignPhase, string>;
    return labels[phase] ?? phase;
  }
}
