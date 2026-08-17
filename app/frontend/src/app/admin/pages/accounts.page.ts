import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { problemDetail } from '../../core/problem-detail';

type Role = 'SUPERADMIN' | 'CAMPAIGN_ADMIN' | 'REVIEWER' | 'UNIT_MEMBER';

interface AccountRecord {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: Role;
  readonly organizationId: string | null;
  readonly teamId: string | null;
  readonly enabled: boolean;
  readonly passwordChangeRequired: boolean;
  readonly campaignIds: readonly string[];
}

interface OrganizationDirectory {
  readonly organizations: readonly {
    readonly id: string;
    readonly code: string;
    readonly name: string;
  }[];
  readonly teams: readonly { readonly id: string; readonly code: string; readonly name: string }[];
}

@Component({
  selector: 'app-admin-accounts-page',
  imports: [FormsModule],
  template: `
    <section class="accounts-page">
      <header>
        <div>
          <p class="eyebrow">Quản trị truy cập</p>
          <h1>Tài khoản và phạm vi quyền</h1>
          <p>
            Mỗi người đăng nhập bằng tài khoản riêng. Superadmin có toàn quyền; các vai trò khác bị
            giới hạn ở máy chủ.
          </p>
        </div>
        <button type="button" (click)="formOpen.set(!formOpen())">
          {{ formOpen() ? 'Đóng' : 'Tạo tài khoản' }}
        </button>
      </header>

      @if (formOpen()) {
        <form (ngSubmit)="create()" aria-label="Tạo tài khoản">
          <div>
            <label for="displayName">Tên hiển thị</label
            ><input id="displayName" name="displayName" [(ngModel)]="displayName" required />
          </div>
          <div>
            <label for="username">Tên đăng nhập</label
            ><input
              id="username"
              name="username"
              [(ngModel)]="username"
              pattern="[a-z0-9._-]{3,40}"
              required
            />
          </div>
          <div>
            <label for="password">Mật khẩu khởi tạo</label
            ><input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              minlength="15"
              maxlength="72"
              autocomplete="new-password"
              required
            />
          </div>
          <div>
            <label for="role">Vai trò</label
            ><select id="role" name="role" [(ngModel)]="role">
              <option value="CAMPAIGN_ADMIN">Admin chiến dịch</option>
              <option value="REVIEWER">Cán bộ thẩm định</option>
              <option value="UNIT_MEMBER">Tài khoản đơn vị</option>
              <option value="SUPERADMIN">Superadmin</option>
            </select>
          </div>
          @if (role === 'UNIT_MEMBER') {
            <div>
              <label for="organizationId">Đơn vị</label
              ><select
                id="organizationId"
                name="organizationId"
                [(ngModel)]="organizationId"
                required
              >
                <option value="" disabled>Chọn đơn vị đã khai báo</option>
                @for (organization of directory().organizations; track organization.id) {
                  <option [value]="organization.id">
                    {{ organization.code }} · {{ organization.name }}
                  </option>
                }
              </select>
            </div>
          }
          @if (role === 'REVIEWER') {
            <div>
              <label for="teamId">Tổ theo dõi</label
              ><select id="teamId" name="teamId" [(ngModel)]="teamId" required>
                <option value="" disabled>Chọn tổ đã khai báo</option>
                @for (team of directory().teams; track team.id) {
                  <option [value]="team.id">{{ team.code }} · {{ team.name }}</option>
                }
              </select>
            </div>
          }
          <div class="form-actions">
            <span>Mật khẩu khởi tạo 15–72 ký tự; tài khoản phải đổi ở lần đầu.</span>
            <button type="submit" [disabled]="saving()">
              {{ saving() ? 'Đang lưu…' : 'Tạo tài khoản' }}
            </button>
          </div>
          @if (formError()) {
            <p class="error" role="alert">{{ formError() }}</p>
          }
        </form>
      }

      <div class="account-table">
        <div class="table-title">
          <strong>{{ accounts().length }} tài khoản</strong
          ><span>Dữ liệu trực tiếp từ backend</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Vai trò</th>
              <th>Phạm vi</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            @for (account of accounts(); track account.id) {
              <tr>
                <td>
                  <strong>{{ account.displayName }}</strong
                  ><span>{{ account.username }}</span>
                </td>
                <td>{{ roleLabel(account.role) }}</td>
                <td>{{ scopeLabel(account) }}</td>
                <td>
                  <span class="state" [class.active]="account.enabled">{{
                    account.enabled ? 'Đang hoạt động' : 'Đã khóa'
                  }}</span>
                  @if (account.passwordChangeRequired) {
                    <small>Chờ đổi mật khẩu</small>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty">Chưa có tài khoản.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }
    .accounts-page {
      width: min(100%, 1440px);
      margin-inline: auto;
      padding: var(--space-8) clamp(20px, 2.5vw, 40px) var(--space-12);
      color: var(--ink);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.035em;
    }
    .eyebrow {
      margin: 0 0 7px;
      color: var(--muted);
      font-size: 12px;
      line-height: 16px;
      font-weight: 600;
      letter-spacing: 0.006em;
    }
    header p:not(.eyebrow) {
      max-width: 720px;
      margin: 8px 0 0;
      color: #5f6b7d;
      line-height: 1.5;
    }
    button,
    input,
    select {
      font: inherit;
    }
    button {
      height: 40px;
      padding: 0 14px;
      border: 0;
      border-radius: 8px;
      color: #fff;
      background: var(--brand);
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.55;
    }
    form {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 15px;
      margin-bottom: 22px;
      padding: 20px;
      border: 1px solid #dce2ea;
      border-radius: 12px;
      background: #fff;
    }
    form div {
      display: grid;
      gap: 6px;
    }
    label {
      font-size: 12px;
      font-weight: 650;
    }
    input,
    select {
      height: 40px;
      padding: 0 11px;
      border: 1px solid #cad3df;
      border-radius: 8px;
      outline: none;
    }
    input:focus,
    select:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--focus);
    }
    .form-actions {
      grid-column: 1/-1;
      display: flex !important;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #edf0f4;
      padding-top: 15px;
    }
    .form-actions span {
      color: #5f6b7d;
      font-size: 12px;
    }
    .account-table {
      border: 1px solid #dce2ea;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }
    .table-title {
      display: flex;
      justify-content: space-between;
      padding: 18px 20px;
      border-bottom: 1px solid #e4e8ee;
    }
    .table-title span {
      color: #5f6b7d;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 14px 20px;
      border-bottom: 1px solid #e9edf2;
      text-align: left;
      font-size: 13px;
    }
    th {
      color: #5f6b7d;
      background: #f8f9fb;
      font-size: 12px;
      line-height: 16px;
    }
    td strong,
    td span,
    td small {
      display: block;
    }
    td > span:not(.state) {
      margin-top: 3px;
      color: #5f6b7d;
      font-size: 12px;
    }
    .state {
      display: inline-block !important;
      padding: 4px 7px;
      border-radius: 6px;
      color: #4b5565;
      background: #eff1f4;
      font-size: 12px;
      line-height: 16px;
    }
    .state.active {
      color: #067647;
      background: #e8f7ef;
    }
    td small {
      margin-top: 4px;
      color: #9a6b12;
    }
    .error {
      color: #b42318;
    }
    .empty {
      text-align: center;
      color: #5f6b7d;
    }
    @media (max-width: 900px) {
      form {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width: 620px) {
      .accounts-page {
        padding: var(--space-6) var(--space-4) var(--space-8);
      }
      header {
        flex-direction: column;
      }
      form {
        grid-template-columns: 1fr;
      }
      .account-table {
        overflow: auto;
      }
      table {
        min-width: 700px;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccountsPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly accounts = signal<readonly AccountRecord[]>([]);
  protected readonly directory = signal<OrganizationDirectory>({ organizations: [], teams: [] });
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
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
