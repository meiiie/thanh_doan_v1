import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import type { AuthenticatedAccount } from '../../api/models';
import { AuthService } from './auth.service';
import { LoginPage } from './login.page';

const account: AuthenticatedAccount = {
  id: 'account-superadmin',
  displayName: 'Quản trị hệ thống',
  role: 'SUPERADMIN',
  campaignIds: ['campaign-summer-2026'],
  capabilities: [],
  organizationId: null,
  teamId: null,
  passwordChangeRequired: false,
};

describe('LoginPage progressive authentication', () => {
  let fixture: ComponentFixture<LoginPage>;
  let host: HTMLElement;
  let auth: ReturnType<typeof createAuthStub>;
  let router: ReturnType<typeof createRouterStub>;

  beforeEach(async () => {
    auth = createAuthStub();
    router = createRouterStub();

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) throw new Error('Missing login host element');
    host = nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('does not call the authentication API before the password step', async () => {
    const username = requiredInput('#login-username');
    enter(username, '  superadmin  ');

    await submitCurrentForm();

    expect(auth.login).not.toHaveBeenCalled();
    expect(requiredInput('#login-username-confirm').value).toBe('superadmin');
    expect(requiredInput('#current-password')).toBe(document.activeElement);
  });

  it('submits both credentials once and routes the authenticated account', async () => {
    enter(requiredInput('#login-username'), 'superadmin');
    await submitCurrentForm();
    enter(requiredInput('#current-password'), 'Strong-local-password');

    await submitCurrentForm();

    expect(auth.login).toHaveBeenCalledOnce();
    expect(auth.login).toHaveBeenCalledWith('superadmin', 'Strong-local-password');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/superadmin/lifecycle', {
      replaceUrl: true,
    });
  });

  it('returns to the identifier step from the full-width Quay lại action', async () => {
    enter(requiredInput('#login-username'), 'superadmin');
    await submitCurrentForm();

    const backButton = host.querySelector<HTMLButtonElement>('.secondary-action');
    if (!backButton) throw new Error('Missing Quay lại action');
    expect(backButton.textContent?.trim()).toBe('Quay lại');
    expect(backButton.textContent).not.toContain('←');
    backButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(requiredInput('#login-username').value).toBe('superadmin');
    expect(requiredInput('#login-username')).toBe(document.activeElement);
    expect(host.querySelector('#current-password')).toBeNull();
  });

  it('uses accessible Neko interface icons for editing and password visibility', async () => {
    enter(requiredInput('#login-username'), 'superadmin');
    await submitCurrentForm();

    const edit = requiredButton('Sửa tên đăng nhập');
    const visibility = requiredButton('Hiện mật khẩu');
    expect(edit.textContent?.trim()).toBe('');
    expect(visibility.textContent?.trim()).toBe('');
    expect(edit.querySelector('img')?.getAttribute('src')).toBe(
      'icons/neko-interface-v1/pencil-simple.svg',
    );
    expect(visibility.querySelector('img')?.getAttribute('src')).toBe(
      'icons/neko-interface-v1/eye.svg',
    );

    visibility.click();
    fixture.detectChanges();

    expect(requiredInput('#current-password').type).toBe('text');
    const hide = requiredButton('Ẩn mật khẩu');
    expect(hide.querySelector('img')?.getAttribute('src')).toBe(
      'icons/neko-interface-v1/eye-slash.svg',
    );
  });

  it('keeps authentication errors generic and preserves the masked password for correction', async () => {
    auth.login.mockRejectedValueOnce(new Error('unknown account'));
    enter(requiredInput('#login-username'), 'unknown-account');
    await submitCurrentForm();
    enter(requiredInput('#current-password'), 'wrong-password');

    await submitCurrentForm();

    const password = requiredInput('#current-password');
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      'Tên đăng nhập hoặc mật khẩu không đúng.',
    );
    expect(password.value).toBe('wrong-password');
    expect(password.type).toBe('password');
    expect(password).toBe(document.activeElement);
  });

  function requiredInput(selector: string): HTMLInputElement {
    const input = host.querySelector<HTMLInputElement>(selector);
    if (!input) throw new Error(`Missing input ${selector}`);
    return input;
  }

  function enter(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function requiredButton(label: string): HTMLButtonElement {
    const button = host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (!button) throw new Error(`Missing button ${label}`);
    return button;
  }

  async function submitCurrentForm(): Promise<void> {
    const form = host.querySelector<HTMLFormElement>('form');
    if (!form) throw new Error('Missing login form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function createAuthStub() {
  return {
    login: vi.fn().mockResolvedValue(account),
    homeFor: vi.fn().mockReturnValue('/superadmin/lifecycle'),
  };
}

function createRouterStub() {
  return { navigateByUrl: vi.fn().mockResolvedValue(true) };
}
