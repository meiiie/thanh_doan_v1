import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected username = '';
  protected password = '';
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);
  protected readonly notice = (() => {
    switch (this.route.snapshot.queryParamMap.get('reason')) {
      case 'session-expired':
        return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
      case 'logged-out':
        return 'Bạn đã đăng xuất an toàn.';
      default:
        return '';
    }
  })();

  protected async submit(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const account = await this.auth.login(this.username, this.password);
      const requested = this.route.snapshot.queryParamMap.get('returnUrl');
      const safeReturnUrl =
        requested?.startsWith('/') && !requested.startsWith('//') && !requested.startsWith('/login')
          ? requested
          : null;
      await this.router.navigateByUrl(
        account.passwordChangeRequired
          ? '/change-password'
          : (safeReturnUrl ?? this.auth.homeFor(account)),
        { replaceUrl: true },
      );
    } catch {
      this.error.set('Tên đăng nhập hoặc mật khẩu không đúng.');
    } finally {
      this.submitting.set(false);
    }
  }
}
