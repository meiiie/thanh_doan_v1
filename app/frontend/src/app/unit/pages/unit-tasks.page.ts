import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { TaskStatus, UnitTask, UnitTaskView } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';
import { targetValue } from '../../shared/form-events';

interface Draft {
  selfScore: number | null;
  evidenceUrl: string;
  summary: string;
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

  protected editable(task: UnitTask): boolean {
    return (
      (this.view()?.phase === 'SELF_ASSESSMENT' ||
        (this.view()?.phase === 'ROUND_1' && task.status === 'RETURNED')) &&
      ['NOT_STARTED', 'DRAFT', 'RETURNED'].includes(task.status)
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
