import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SessionLifecycleService } from './session-lifecycle.service';
import { CsrfTokenStore } from './csrf-token.store';

export type AccountRole = 'SUPERADMIN' | 'CAMPAIGN_ADMIN' | 'REVIEWER' | 'UNIT_MEMBER';

export interface AuthenticatedAccount {
  readonly id: string;
  readonly displayName: string;
  readonly role: AccountRole;
  readonly campaignIds: readonly string[];
  readonly capabilities: readonly string[];
  readonly organizationId: string | null;
  readonly teamId: string | null;
  readonly passwordChangeRequired: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionLifecycleService);
  private readonly csrf = inject(CsrfTokenStore);
  private loadPromise: Promise<AuthenticatedAccount | null> | null = null;

  readonly account = signal<AuthenticatedAccount | null>(null);

  load(): Promise<AuthenticatedAccount | null> {
    if (!this.loadPromise) {
      this.loadPromise = this.ensureCsrf()
        .then(() => firstValueFrom(this.http.get<AuthenticatedAccount>('/api/auth/me')))
        .then((account) => {
          this.account.set(account);
          return account;
        })
        .catch(() => {
          this.account.set(null);
          return null;
        });
    }
    return this.loadPromise;
  }

  async login(username: string, password: string): Promise<AuthenticatedAccount> {
    await this.ensureCsrf();
    const account = await firstValueFrom(
      this.http.post<AuthenticatedAccount>('/api/auth/login', { username, password }),
    );
    this.account.set(account);
    this.loadPromise = Promise.resolve(account);
    return account;
  }

  async refresh(): Promise<AuthenticatedAccount> {
    const account = await firstValueFrom(
      this.http.get<AuthenticatedAccount>('/api/auth/me', {
        headers: { 'X-Session-Refresh': 'true' },
      }),
    );
    this.account.set(account);
    this.loadPromise = Promise.resolve(account);
    return account;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>('/api/auth/logout', {}, { headers: this.csrfHeader() }),
      );
    } catch (error) {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) throw error;
    }
    this.account.set(null);
    this.loadPromise = Promise.resolve(null);
    this.session.clear();
    this.csrf.clear();
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthenticatedAccount> {
    const account = await firstValueFrom(
      this.http.post<AuthenticatedAccount>(
        '/api/auth/change-password',
        {
          currentPassword,
          newPassword,
        },
        { headers: this.csrfHeader() },
      ),
    );
    this.account.set(account);
    this.loadPromise = Promise.resolve(account);
    return account;
  }

  clear(): void {
    this.account.set(null);
    this.loadPromise = null;
    this.session.clear();
    this.csrf.clear();
  }

  homeFor(account: AuthenticatedAccount): string {
    switch (account.role) {
      case 'SUPERADMIN':
        return '/superadmin/lifecycle';
      case 'CAMPAIGN_ADMIN':
        return '/admin/scorecard-templates';
      case 'REVIEWER':
        return '/reviewer/queue';
      case 'UNIT_MEMBER':
        return '/unit/tasks';
    }
  }

  private async ensureCsrf(): Promise<void> {
    const response = await firstValueFrom(this.http.get<{ token: string }>('/api/auth/csrf'));
    this.csrf.set(response.token);
  }

  private csrfHeader(): Record<string, string> {
    const token = this.csrf.token();
    return token ? { 'X-XSRF-TOKEN': token } : {};
  }
}
