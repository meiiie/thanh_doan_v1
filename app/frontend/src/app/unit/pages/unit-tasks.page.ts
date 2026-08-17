import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { problemDetail } from '../../core/problem-detail';
import { CampaignPhase } from '../../shared/domain-types';
import { targetValue } from '../../shared/form-events';

type TaskStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'RESUBMITTED' | 'RETURNED' | 'LOCKED';

interface UnitTask {
  readonly lineId: string;
  readonly groupCode: string;
  readonly lineCode: string;
  readonly title: string;
  readonly requirement: string;
  readonly evidenceHint: string;
  readonly evidencePolicy: string;
  readonly evidenceRequired: boolean;
  readonly summaryRequired: boolean;
  readonly maximumScore: number;
  readonly reviewTeamName: string;
  readonly status: TaskStatus;
  readonly selfScore: number | null;
  readonly evidenceUrl: string;
  readonly summary: string;
  readonly revision: number;
  readonly version: number;
  readonly returnReason: string;
  readonly returnedAt: string | null;
  readonly roundOneScore: number | null;
  readonly roundOneReason: string;
  readonly roundOneDecidedBy: string;
  readonly roundOneDecidedAt: string | null;
  readonly explanationBody: string;
  readonly explanationEvidenceUrl: string;
  readonly explanationRevision: number;
  readonly explanationSubmittedAt: string | null;
  readonly roundTwoScore: number | null;
  readonly roundTwoReason: string;
  readonly roundTwoDecidedBy: string;
  readonly roundTwoDecidedAt: string | null;
}

interface UnitTaskView {
  readonly campaignName: string;
  readonly phase: CampaignPhase;
  readonly organizationName: string;
  readonly unitGroupName: string;
  readonly tasks: readonly UnitTask[];
}

interface Draft {
  selfScore: number | null;
  evidenceUrl: string;
  summary: string;
  explanationBody: string;
  explanationEvidenceUrl: string;
}

@Component({
  selector: 'app-unit-tasks-page',
  templateUrl: './unit-tasks.page.html',
  styleUrl: './unit-tasks.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitTasksPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly view = signal<UnitTaskView | null>(null);
  protected readonly drafts = signal<Record<string, Draft>>({});
  protected readonly message = signal('');
  protected readonly busyLine = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected draft(task: UnitTask): Draft {
    return (
      this.drafts()[task.lineId] ?? {
        selfScore: task.selfScore,
        evidenceUrl: task.evidenceUrl,
        summary: task.summary,
        explanationBody: task.explanationBody,
        explanationEvidenceUrl: task.explanationEvidenceUrl,
      }
    );
  }

  protected setScore(task: UnitTask, event: Event): void {
    const value = targetValue(event);
    this.patchDraft(task, { selfScore: value === '' ? null : Number(value) });
  }

  protected setEvidence(task: UnitTask, event: Event): void {
    this.patchDraft(task, { evidenceUrl: targetValue(event) });
  }

  protected setSummary(task: UnitTask, event: Event): void {
    this.patchDraft(task, { summary: targetValue(event) });
  }

  protected setExplanation(task: UnitTask, event: Event): void {
    this.patchDraft(task, { explanationBody: targetValue(event) });
  }

  protected setExplanationEvidence(task: UnitTask, event: Event): void {
    this.patchDraft(task, { explanationEvidenceUrl: targetValue(event) });
  }

  protected editable(task: UnitTask): boolean {
    return (
      (this.view()?.phase === 'SELF_ASSESSMENT' ||
        (this.view()?.phase === 'ROUND_1' && task.status === 'RETURNED')) &&
      ['NOT_STARTED', 'DRAFT', 'RETURNED'].includes(task.status)
    );
  }

  protected canExplain(task: UnitTask): boolean {
    return (
      this.view()?.phase === 'EXPLANATION' &&
      task.roundOneScore !== null &&
      task.selfScore !== null &&
      task.roundOneScore < task.selfScore
    );
  }

  protected statusLabel(status: TaskStatus): string {
    const labels = {
      NOT_STARTED: 'Chưa nhập',
      DRAFT: 'Bản nháp',
      SUBMITTED: 'Đã gửi',
      RESUBMITTED: 'Đã gửi lại',
      RETURNED: 'Cần bổ sung',
      LOCKED: 'Đã khóa',
    } satisfies Record<TaskStatus, string>;
    return labels[status] ?? status;
  }

  protected async save(task: UnitTask, submit: boolean): Promise<void> {
    if (this.busyLine()) return;
    this.busyLine.set(task.lineId);
    this.message.set('');
    try {
      const draft = this.draft(task);
      const endpoint = submit ? 'submit' : 'draft';
      const url = `/api/unit/tasks/${encodeURIComponent(task.lineId)}/${endpoint}`;
      const body = { ...draft, expectedVersion: task.version };
      const updated = await firstValueFrom(
        submit
          ? this.http.post<UnitTaskView>(url, body, {
              headers: { 'Idempotency-Key': crypto.randomUUID() },
            })
          : this.http.put<UnitTaskView>(url, body),
      );
      this.apply(updated);
      this.message.set(
        submit ? `Đã gửi dòng ${task.lineCode} tới Tổ thẩm định.` : `Đã lưu dòng ${task.lineCode}.`,
      );
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể lưu hồ sơ.')
          : 'Không thể lưu hồ sơ.',
      );
    } finally {
      this.busyLine.set(null);
    }
  }

  protected async submitExplanation(task: UnitTask): Promise<void> {
    if (this.busyLine() || !this.canExplain(task)) return;
    this.busyLine.set(task.lineId);
    this.message.set('');
    try {
      const draft = this.draft(task);
      const updated = await firstValueFrom(
        this.http.post<UnitTaskView>(
          `/api/unit/tasks/${encodeURIComponent(task.lineId)}/explanation`,
          {
            body: draft.explanationBody,
            evidenceUrl: draft.explanationEvidenceUrl,
            expectedRevision: task.explanationRevision,
          },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã gửi giải trình dòng ${task.lineCode} cho cán bộ vòng 2.`);
    } catch (error) {
      this.message.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể gửi giải trình.')
          : 'Không thể gửi giải trình.',
      );
    } finally {
      this.busyLine.set(null);
    }
  }

  private async load(): Promise<void> {
    try {
      this.apply(await firstValueFrom(this.http.get<UnitTaskView>('/api/unit/tasks')));
    } catch {
      this.message.set('Không đọc được danh sách công việc của đơn vị.');
    }
  }

  private apply(view: UnitTaskView): void {
    this.view.set(view);
    this.drafts.set(
      Object.fromEntries(
        view.tasks.map((task) => [
          task.lineId,
          {
            selfScore: task.selfScore,
            evidenceUrl: task.evidenceUrl,
            summary: task.summary,
            explanationBody: task.explanationBody,
            explanationEvidenceUrl: task.explanationEvidenceUrl,
          },
        ]),
      ),
    );
  }

  private patchDraft(task: UnitTask, patch: Partial<Draft>): void {
    this.drafts.update((values) => ({
      ...values,
      [task.lineId]: { ...this.draft(task), ...patch },
    }));
  }
}
