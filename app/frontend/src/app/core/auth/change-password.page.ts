import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { problemDetail } from '../problem-detail';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-change-password-page',
  imports: [FormsModule],
  templateUrl: './change-password.page.html',
  styleUrls: ['./login.page.css', './change-password.page.css'],
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
  protected readonly errorField = signal<'current' | 'new' | 'confirmation' | null>(null);
  protected readonly showCurrentPassword = signal(false);
  protected readonly showNewPassword = signal(false);
  protected readonly showConfirmation = signal(false);
  protected readonly portalLabel = (() => {
    switch (globalThis.location?.port) {
      case '4317':
        return 'Bản phát triển';
      case '4319':
        return 'Kiểm định TLS';
      default:
        return 'Cổng nội bộ';
    }
  })();
  protected readonly currentPasswordInput =
    viewChild<ElementRef<HTMLInputElement>>('currentPasswordInput');
  protected readonly newPasswordInput = viewChild<ElementRef<HTMLInputElement>>('newPasswordInput');
  protected readonly confirmationInput =
    viewChild<ElementRef<HTMLInputElement>>('confirmationInput');

  protected busy(): boolean {
    return this.submitting() || this.loggingOut();
  }

  protected passwordIcon(visible: boolean): string {
    return visible ? 'icons/neko-interface-v1/eye-slash.svg' : 'icons/neko-interface-v1/eye.svg';
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    if (this.newPassword.length < 15 || this.newPassword.length > 72) {
      this.error.set('Mật khẩu mới phải có từ 15 đến 72 ký tự.');
      this.errorField.set('new');
      this.newPasswordInput()?.nativeElement.focus();
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.error.set('Mật khẩu mới không được trùng mật khẩu khởi tạo.');
      this.errorField.set('new');
      this.newPasswordInput()?.nativeElement.focus();
      return;
    }
    if (this.newPassword !== this.confirmation) {
      this.error.set('Mật khẩu nhập lại chưa khớp.');
      this.errorField.set('confirmation');
      this.confirmationInput()?.nativeElement.focus();
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.errorField.set(null);
    try {
      const account = await this.auth.changePassword(this.currentPassword, this.newPassword);
      await this.router.navigateByUrl(this.auth.homeFor(account));
    } catch (error) {
      this.hidePasswords();
      this.errorField.set('current');
      this.error.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại.')
          : 'Không thể đổi mật khẩu. Hãy kiểm tra mật khẩu hiện tại.',
      );
      setTimeout(() => this.currentPasswordInput()?.nativeElement.focus());
    } finally {
      this.submitting.set(false);
    }
  }

  protected async logout(): Promise<void> {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.error.set('');
    this.errorField.set(null);
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

  private hidePasswords(): void {
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmation.set(false);
  }
}
