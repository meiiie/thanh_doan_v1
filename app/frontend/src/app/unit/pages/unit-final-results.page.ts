import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UnitFinalResult } from '../../api/models';
import { AppIconComponent } from '../../shared/app-icon.component';

@Component({
  selector: 'app-unit-final-results-page',
  imports: [AppIconComponent],
  templateUrl: './unit-final-results.page.html',
  styleUrl: './unit-final-results.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitFinalResultsPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly view = signal<UnitFinalResult | null>(null);
  protected readonly message = signal('');

  async ngOnInit(): Promise<void> {
    try {
      this.view.set(
        await firstValueFrom(this.http.get<UnitFinalResult>('/api/unit/results/final')),
      );
    } catch {
      this.message.set('Không đọc được kết quả cuối của đơn vị.');
    }
  }

  protected formatScore(value: number | null | undefined): string {
    return value === null || value === undefined
      ? '—'
      : value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  }

  protected formatPercent(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`;
  }
}
