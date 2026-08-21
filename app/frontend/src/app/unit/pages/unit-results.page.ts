import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { UnitTask, UnitTaskView } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';
import { AppIconComponent } from '../../shared/app-icon.component';
import { targetValue } from '../../shared/form-events';

interface ExplanationDraft {
  body: string;
  evidenceUrl: string;
}

@Component({
  selector: 'app-unit-results-page',
  imports: [AppIconComponent],
  templateUrl: './unit-results.page.html',
  styleUrl: './unit-results.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitResultsPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly view = signal<UnitTaskView | null>(null);
  protected readonly selectedLineId = signal<string | null>(null);
  protected readonly drafts = signal<Record<string, ExplanationDraft>>({});
  protected readonly message = signal('');
  protected readonly busyLine = signal<string | null>(null);
  protected readonly visibleTasks = computed(() =>
    (this.view()?.tasks ?? []).filter(
      (task) => task.roundOneScore !== null && task.roundOneScore !== undefined,
    ),
  );
  protected readonly selectedTask = computed(() => {
    const tasks = this.visibleTasks();
    return tasks.find((task) => task.lineId === this.selectedLineId()) ?? null;
  });

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected selectTask(task: UnitTask): void {
    this.selectedLineId.set(task.lineId);
  }

  protected closeTask(): void {
    this.selectedLineId.set(null);
  }

  protected resultScore(task: UnitTask): number | null {
    return task.roundOneScore ?? null;
  }

  protected changed(task: UnitTask): boolean {
    const score = this.resultScore(task);
    return score !== null && task.selfScore !== null && score < task.selfScore;
  }

  protected canExplain(task: UnitTask): boolean {
    return this.view()?.phase === 'EXPLANATION' && this.changed(task);
  }

  protected statusLabel(task: UnitTask): string {
    return task.explanationRevision > 0 ? 'Đã gửi giải trình' : 'Cần giải trình';
  }

  protected emptyTitle(phase: UnitTaskView['phase']): string {
    return phase === 'ROUND_1' ? 'Vòng 1 đang được thẩm định' : 'Không có nội dung cần giải trình';
  }

  protected emptyDescription(phase: UnitTaskView['phase']): string {
    return phase === 'ROUND_1'
      ? 'Điểm thẩm định chưa được công khai trong khi cán bộ đang chấm.'
      : 'Chỉ tiêu chí có điểm thẩm định thấp hơn điểm tự chấm mới xuất hiện tại đây.';
  }

  protected draft(task: UnitTask): ExplanationDraft {
    return (
      this.drafts()[task.lineId] ?? {
        body: task.explanationBody,
        evidenceUrl: task.explanationEvidenceUrl,
      }
    );
  }

  protected setBody(task: UnitTask, event: Event): void {
    this.patch(task, { body: targetValue(event) });
  }

  protected setEvidence(task: UnitTask, event: Event): void {
    this.patch(task, { evidenceUrl: targetValue(event) });
  }

  protected async submitExplanation(task: UnitTask): Promise<void> {
    if (!this.canExplain(task) || this.busyLine()) return;
    this.busyLine.set(task.lineId);
    this.message.set('');
    try {
      const draft = this.draft(task);
      const updated = await firstValueFrom(
        this.http.post<UnitTaskView>(
          `/api/unit/tasks/${encodeURIComponent(task.lineId)}/explanation`,
          {
            body: draft.body,
            evidenceUrl: draft.evidenceUrl,
            expectedRevision: task.explanationRevision,
          },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } },
        ),
      );
      this.apply(updated);
      this.message.set(`Đã gửi giải trình ${task.lineCode}; lịch sử cũ được giữ nguyên.`);
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
      this.message.set('Không đọc được kết quả của đơn vị.');
    }
  }

  private apply(view: UnitTaskView): void {
    this.view.set(view);
    this.drafts.set(
      Object.fromEntries(
        view.tasks.map((task) => [
          task.lineId,
          { body: task.explanationBody, evidenceUrl: task.explanationEvidenceUrl },
        ]),
      ),
    );
  }

  private patch(task: UnitTask, patch: Partial<ExplanationDraft>): void {
    this.drafts.update((values) => ({
      ...values,
      [task.lineId]: { ...this.draft(task), ...patch },
    }));
  }
}
