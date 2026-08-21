import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { AccountRecord, AccountRole as Role, OrganizationDirectory } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';

@Component({
  selector: 'app-admin-accounts-page',
  imports: [FormsModule],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccountsPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly accounts = signal<readonly AccountRecord[]>([]);
  protected readonly directory = signal<OrganizationDirectory>({
    unitGroups: [],
    organizations: [],
    teams: [],
  });
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly updatingAccountId = signal<string | null>(null);
  protected readonly loadError = signal('');
  protected readonly formError = signal('');
  protected displayName = '';
  protected username = '';
  protected password = '';
  protected role: Role = 'CAMPAIGN_ADMIN';
  protected organizationId = '';
  protected teamId = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async create(): Promise<void> {
    this.saving.set(true);
    this.formError.set('');
    try {
      await firstValueFrom(
        this.http.post('/api/accounts', {
          username: this.username,
          displayName: this.displayName,
          password: this.password,
          role: this.role,
          organizationId: this.organizationId || null,
          teamId: this.teamId || null,
        }),
      );
      this.displayName = '';
      this.username = '';
      this.password = '';
      this.organizationId = '';
      this.teamId = '';
      this.formOpen.set(false);
      await this.load();
    } catch (error) {
      this.formError.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể tạo tài khoản.')
          : 'Không thể tạo tài khoản.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected roleLabel(role: Role): string {
    return {
      SUPERADMIN: 'Superadmin',
      CAMPAIGN_ADMIN: 'Admin chiến dịch',
      REVIEWER: 'Cán bộ thẩm định',
      UNIT_MEMBER: 'Tài khoản đơn vị',
    }[role];
  }
  protected async setEnabled(account: AccountRecord, enabled: boolean): Promise<void> {
    if (this.updatingAccountId()) return;
    this.updatingAccountId.set(account.id);
    this.loadError.set('');
    try {
      const updated = await firstValueFrom(
        this.http.patch<AccountRecord>(`/api/accounts/${encodeURIComponent(account.id)}/status`, {
          enabled,
        }),
      );
      this.accounts.update((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      this.loadError.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể cập nhật trạng thái tài khoản.')
          : 'Không thể cập nhật trạng thái tài khoản.',
      );
    } finally {
      this.updatingAccountId.set(null);
    }
  }
  protected scopeLabel(account: AccountRecord): string {
    if (account.role === 'SUPERADMIN') return 'Toàn hệ thống';
    if (account.organizationId) {
      const organization = this.directory().organizations.find(
        (item) => item.id === account.organizationId,
      );
      if (organization) return organization.name;
    }
    if (account.teamId) {
      const team = this.directory().teams.find((item) => item.id === account.teamId);
      if (team) return team.name;
    }
    return (
      account.organizationId ??
      account.teamId ??
      (account.campaignIds.length ? 'Chiến dịch TNTN Hè 2026' : 'Chưa gán')
    );
  }
  private async load(): Promise<void> {
    try {
      const [accounts, directory] = await Promise.all([
        firstValueFrom(this.http.get<readonly AccountRecord[]>('/api/accounts')),
        firstValueFrom(this.http.get<OrganizationDirectory>('/api/organization-directory')),
      ]);
      this.accounts.set(accounts);
      this.directory.set(directory);
    } catch {
      this.loadError.set('Không đọc được danh sách tài khoản.');
    }
  }
}
