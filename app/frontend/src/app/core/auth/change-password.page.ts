import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { problemDetail } from '../problem-detail';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-change-password-page',
  imports: [FormsModule],
  templateUrl: './change-password.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected currentPassword = '';
  protected newPassword = '';
  protected confirmation = '';
  protected readonly submitting = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly error = signal('');
  protected readonly showPasswords = signal(false);

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.newPassword.length < 15 || this.newPassword.length > 72) {
      this.error.set('Mật khẩu mới phải có từ 15 đến 72 ký tự.');
      return;
    }
    if (this.newPassword !== this.confirmation) {
      this.error.set('Mật khẩu nhập lại chưa khớp.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    try {
      const account = await this.auth.changePassword(this.currentPassword, this.newPassword);
      await this.router.navigateByUrl(this.auth.homeFor(account));
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại.')
          : 'Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  protected async logout(): Promise<void> {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.error.set('');
    try {
      await this.auth.logout();
      await this.router.navigate(['/login'], {
        queryParams: { reason: 'logged-out' },
        replaceUrl: true,
      });
    } catch {
      this.error.set('Chưa thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      this.loggingOut.set(false);
    }
  }
}
