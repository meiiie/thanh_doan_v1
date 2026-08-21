import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
  protected readonly stage = signal<'identifier' | 'password'>('identifier');
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);
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
  protected readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');
  protected readonly passwordInput = viewChild<ElementRef<HTMLInputElement>>('passwordInput');
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

  constructor() {
    effect(() => {
      const input = this.stage() === 'identifier' ? this.usernameInput() : this.passwordInput();
      if (!this.submitting()) input?.nativeElement.focus();
    });
  }

  protected continueToPassword(): void {
    const username = this.username.trim();
    if (!username) {
      this.usernameInput()?.nativeElement.focus();
      return;
    }
    this.username = username;
    this.password = '';
    this.error.set('');
    this.showPassword.set(false);
    this.stage.set('password');
  }

  protected editUsername(): void {
    if (this.submitting()) return;
    this.password = '';
    this.error.set('');
    this.showPassword.set(false);
    this.stage.set('identifier');
  }

  protected async submit(): Promise<void> {
    if (this.submitting() || !this.username || !this.password) return;
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
      this.showPassword.set(false);
      this.error.set('Tên đăng nhập hoặc mật khẩu không đúng.');
    } finally {
      this.submitting.set(false);
      if (this.error()) {
        setTimeout(() => this.passwordInput()?.nativeElement.focus());
      }
    }
  }
}
