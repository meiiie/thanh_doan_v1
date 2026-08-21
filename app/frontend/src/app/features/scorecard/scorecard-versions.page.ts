import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AssignmentWorkbench, ScorecardCatalog } from '../../api/models';
import { campaignPhaseLabel } from './scorecard-workbench';

@Component({
  selector: 'app-scorecard-versions-page',
  imports: [RouterLink],
  templateUrl: './scorecard-versions.page.html',
  styleUrl: './scorecard-versions.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScorecardVersionsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly scorecardRoute = this.router.url.startsWith('/superadmin')
    ? '/superadmin/scorecards'
    : '/admin/scorecard-templates';
  protected readonly catalog = signal<ScorecardCatalog | null>(null);
  protected readonly workbench = signal<AssignmentWorkbench | null>(null);
  protected readonly error = signal('');

  async ngOnInit(): Promise<void> {
    try {
      const [catalog, workbench] = await Promise.all([
        firstValueFrom(this.http.get<ScorecardCatalog>('/api/scorecards/current')),
        firstValueFrom(this.http.get<AssignmentWorkbench>('/api/assignments/current')),
      ]);
      this.catalog.set(catalog);
      this.workbench.set(workbench);
    } catch {
      this.error.set('Không đọc được trạng thái phiên bản hiện hành.');
    }
  }

  protected phaseLabel(): string {
    const phase = this.workbench()?.phase;
    return phase ? campaignPhaseLabel(phase) : '';
  }
}
