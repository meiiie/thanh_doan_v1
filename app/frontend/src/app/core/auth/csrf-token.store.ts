import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsrfTokenStore {
  readonly token = signal('');

  set(token: string): void {
    this.token.set(token);
  }

  clear(): void {
    this.token.set('');
  }
}
