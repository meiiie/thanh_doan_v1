import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach } from 'vitest';
import type { AccountRole, AuthenticatedAccount } from '../../api/models';
import { AuthService } from './auth.service';

const destinations = new Map<AccountRole, string>([
  ['SUPERADMIN', '/superadmin/lifecycle'],
  ['CAMPAIGN_ADMIN', '/admin/scorecard-templates'],
  ['REVIEWER', '/reviewer/queue'],
  ['UNIT_MEMBER', '/unit/tasks'],
]);

function account(role: AccountRole): AuthenticatedAccount {
  return {
    id: `account-${role}`,
    displayName: role,
    role,
    campaignIds: ['campaign-summer-2026'],
    capabilities: [],
    organizationId: role === 'UNIT_MEMBER' ? 'organization-1' : null,
    teamId: role === 'REVIEWER' ? 'team-1' : null,
    passwordChangeRequired: false,
  };
}

describe('AuthService role routing', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  for (const [role, destination] of destinations) {
    it(`routes ${role} to its workspace`, () => {
      expect(service.homeFor(account(role))).toBe(destination);
    });
  }

  it('refreshes the CSRF token after login replaces the anonymous session', async () => {
    const admin = account('CAMPAIGN_ADMIN');
    const login = service.login('uat.admin', 'local-password');

    http.expectOne('/api/auth/csrf').flush({ token: 'anonymous-session-token' });
    // Allow both ensureCsrf() and login() to resume after the first request.
    await Promise.resolve();
    await Promise.resolve();
    http
      .expectOne((request) => request.url === '/api/auth/login' && request.method === 'POST')
      .flush(admin);
    await Promise.resolve();
    http.expectOne('/api/auth/csrf').flush({ token: 'authenticated-session-token' });

    await expect(login).resolves.toEqual(admin);
    expect(service.account()).toEqual(admin);
  });
});
