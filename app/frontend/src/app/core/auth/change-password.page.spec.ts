import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { AuthenticatedAccount } from '../../api/models';
import { AuthService } from './auth.service';
import { ChangePasswordPage } from './change-password.page';

const account: AuthenticatedAccount = {
  id: 'account-admin',
  displayName: 'Quản trị chiến dịch',
  role: 'CAMPAIGN_ADMIN',
  campaignIds: ['campaign-summer-2026'],
  capabilities: [],
  organizationId: null,
  teamId: null,
  passwordChangeRequired: false,
};

describe('ChangePasswordPage', () => {
  let fixture: ComponentFixture<ChangePasswordPage>;
  let host: HTMLElement;
  let auth: ReturnType<typeof createAuthStub>;
  let router: ReturnType<typeof createRouterStub>;

  beforeEach(async () => {
    auth = createAuthStub();
    router = createRouterStub();

    await TestBed.configureTestingModule({
      imports: [ChangePasswordPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordPage);
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) throw new Error('Missing change-password host');
    host = nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('uses the same focused auth frame and control language as login', () => {
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('.login-frame')).not.toBeNull();
    expect(host.querySelector('.brand-lockup strong')?.textContent).toContain('Neko Đoàn');
    expect(host.querySelector('.auth-context')).toBeNull();
    expect(requiredInput('#current-password').getAttribute('autocomplete')).toBe(
      'current-password',
    );
    expect(requiredInput('#new-password').getAttribute('autocomplete')).toBe('new-password');
    expect(requiredInput('#password-confirmation').getAttribute('autocomplete')).toBe(
      'new-password',
    );
  });

  it('uses independent Neko SVG visibility controls for all password fields', () => {
    const currentToggle = requiredButton('Hiện mật khẩu khởi tạo');
    expect(currentToggle.querySelector('img')?.getAttribute('src')).toBe(
      'icons/neko-interface-v1/eye.svg',
    );

    currentToggle.click();
    fixture.detectChanges();

    expect(requiredInput('#current-password').type).toBe('text');
    expect(requiredInput('#new-password').type).toBe('password');
    expect(requiredButton('Ẩn mật khẩu khởi tạo').querySelector('img')?.getAttribute('src')).toBe(
      'icons/neko-interface-v1/eye-slash.svg',
    );
  });

  it('blocks a reused initial password and focuses the new-password field', async () => {
    enterAll('Initial-password-2026', 'Initial-password-2026', 'Initial-password-2026');

    await submitForm();

    expect(auth.changePassword).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'không được trùng mật khẩu khởi tạo',
    );
    expect(requiredInput('#new-password')).toBe(document.activeElement);
    expect(requiredInput('#new-password').getAttribute('aria-invalid')).toBe('true');
  });

  it('blocks a mismatched confirmation and keeps all values for correction', async () => {
    enterAll('Initial-password-2026', 'New-password-2026', 'Different-password-2026');

    await submitForm();

    expect(auth.changePassword).not.toHaveBeenCalled();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('chưa khớp');
    expect(requiredInput('#current-password').value).toBe('Initial-password-2026');
    expect(requiredInput('#new-password').value).toBe('New-password-2026');
    expect(requiredInput('#password-confirmation').value).toBe('Different-password-2026');
    expect(requiredInput('#password-confirmation')).toBe(document.activeElement);
  });

  it('changes the password once and routes to the account workspace', async () => {
    enterAll('Initial-password-2026', 'New-password-2026', 'New-password-2026');

    await submitForm();

    expect(auth.changePassword).toHaveBeenCalledOnce();
    expect(auth.changePassword).toHaveBeenCalledWith('Initial-password-2026', 'New-password-2026');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/admin/scorecard-templates');
  });

  function requiredInput(selector: string): HTMLInputElement {
    const input = host.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`Missing input ${selector}`);
    return input;
  }

  function requiredButton(label: string): HTMLButtonElement {
    const button = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!button) throw new Error(`Missing button ${label}`);
    return button;
  }

  function enter(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function enterAll(current: string, next: string, confirmation: string): void {
    enter(requiredInput('#current-password'), current);
    enter(requiredInput('#new-password'), next);
    enter(requiredInput('#password-confirmation'), confirmation);
  }

  async function submitForm(): Promise<void> {
    const form = host.querySelector<HTMLFormElement>('form');
    if (!form) throw new Error('Missing change-password form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function createAuthStub() {
  return {
    changePassword: vi.fn().mockResolvedValue(account),
    logout: vi.fn().mockResolvedValue(undefined),
    homeFor: vi.fn().mockReturnValue('/admin/scorecard-templates'),
  };
}

function createRouterStub() {
  return {
    navigateByUrl: vi.fn().mockResolvedValue(true),
    navigate: vi.fn().mockResolvedValue(true),
  };
}
