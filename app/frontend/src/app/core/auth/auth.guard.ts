import { inject } from '@angular/core';
import { CanActivateFn, Data, Router } from '@angular/router';
import { AccountRole, AuthService } from './auth.service';

const ACCOUNT_ROLES: readonly AccountRole[] = [
  'SUPERADMIN',
  'CAMPAIGN_ADMIN',
  'REVIEWER',
  'UNIT_MEMBER',
];

/** Dữ liệu route là `any` của Angular; chỉ chấp nhận giá trị khớp bảng vai trò đã biết. */
function parseAllowedRoles(data: Data): readonly AccountRole[] {
  const roles = data['roles'];
  return Array.isArray(roles)
    ? roles.filter((role): role is AccountRole => ACCOUNT_ROLES.includes(role))
    : [];
}

export const authenticatedGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const account = await auth.load();
  if (!account) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (account.passwordChangeRequired && state.url !== '/change-password') {
    return router.parseUrl('/change-password');
  }
  if (!account.passwordChangeRequired && state.url === '/change-password') {
    return router.parseUrl(auth.homeFor(account));
  }
  const allowedRoles = parseAllowedRoles(route.data);
  if (
    account.role === 'SUPERADMIN' ||
    allowedRoles.length === 0 ||
    allowedRoles.includes(account.role)
  ) {
    return true;
  }
  return router.parseUrl(auth.homeFor(account));
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const account = await auth.load();
  return account
    ? router.parseUrl(account.passwordChangeRequired ? '/change-password' : auth.homeFor(account))
    : true;
};
