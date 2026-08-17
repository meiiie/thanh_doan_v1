import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionLifecycleService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(Date.now());
  private readonly expiresAt = signal<number | null>(null);
  private readonly timer = window.setInterval(() => this.now.set(Date.now()), 1_000);

  readonly remainingSeconds = computed(() => {
    const expiry = this.expiresAt();
    return expiry === null ? null : Math.max(0, Math.ceil((expiry - this.now()) / 1_000));
  });
  readonly warningVisible = computed(() => {
    const remaining = this.remainingSeconds();
    return remaining !== null && remaining > 0 && remaining <= 120;
  });

  constructor() {
    this.destroyRef.onDestroy(() => window.clearInterval(this.timer));
  }

  observe(headerValue: string | null): void {
    if (!headerValue) return;
    const parsed = Date.parse(headerValue);
    if (Number.isFinite(parsed)) this.expiresAt.set(parsed);
  }

  clear(): void {
    this.expiresAt.set(null);
  }
}
