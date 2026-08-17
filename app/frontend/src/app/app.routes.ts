import { Routes } from '@angular/router';
import { authenticatedGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Đăng nhập · Dấu Xanh Hải Phòng',
    loadComponent: () => import('./core/auth/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'change-password',
    canActivate: [authenticatedGuard],
    title: 'Đổi mật khẩu · Dấu Xanh Hải Phòng',
    loadComponent: () =>
      import('./core/auth/change-password.page').then((module) => module.ChangePasswordPage),
  },
  {
    path: 'superadmin',
    canActivate: [authenticatedGuard],
    data: { workspace: 'superadmin', roles: ['SUPERADMIN'] },
    loadComponent: () =>
      import('./admin/admin-shell.component').then((module) => module.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'lifecycle' },
      {
        path: 'lifecycle',
        title: 'Vòng đời chiến dịch · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/campaign/campaign-status.page').then(
            (module) => module.CampaignStatusPage,
          ),
      },
      {
        path: 'scorecards',
        title: 'Bảng điểm và phân công · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/scorecard/scorecard-catalog.page').then(
            (module) => module.ScorecardCatalogPage,
          ),
      },
      {
        path: 'results',
        title: 'Kết quả và đối soát · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/result/final-results.page').then((module) => module.FinalResultsPage),
      },
      {
        path: 'accounts',
        title: 'Tài khoản và quyền · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./admin/pages/accounts.page').then((module) => module.AdminAccountsPage),
      },
      {
        path: 'structure',
        title: 'Cơ cấu tổ chức · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/organization/organization-directory.page').then(
            (module) => module.OrganizationDirectoryPage,
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authenticatedGuard],
    data: { workspace: 'campaign-admin', roles: ['CAMPAIGN_ADMIN'] },
    loadComponent: () =>
      import('./admin/admin-shell.component').then((module) => module.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'scorecard-templates' },
      {
        path: 'scorecard-templates',
        title: 'Bảng điểm và phân công · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/scorecard/scorecard-catalog.page').then(
            (module) => module.ScorecardCatalogPage,
          ),
      },
      {
        path: 'lifecycle',
        title: 'Vòng đời chiến dịch · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/campaign/campaign-status.page').then(
            (module) => module.CampaignStatusPage,
          ),
      },
      {
        path: 'results',
        title: 'Kết quả và đối soát · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./features/result/final-results.page').then((module) => module.FinalResultsPage),
      },
    ],
  },
  {
    path: 'unit',
    canActivate: [authenticatedGuard],
    data: { workspace: 'unit', roles: ['UNIT_MEMBER'] },
    loadComponent: () =>
      import('./admin/admin-shell.component').then((module) => module.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      {
        path: 'tasks',
        title: 'Việc cần thực hiện · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./unit/pages/unit-tasks.page').then((module) => module.UnitTasksPage),
      },
    ],
  },
  {
    path: 'reviewer',
    canActivate: [authenticatedGuard],
    data: { workspace: 'reviewer', roles: ['REVIEWER'] },
    loadComponent: () =>
      import('./admin/admin-shell.component').then((module) => module.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'queue' },
      {
        path: 'queue',
        title: 'Hàng chờ thẩm định · Dấu Xanh Hải Phòng',
        loadComponent: () =>
          import('./reviewer/pages/review-queue.page').then((module) => module.ReviewQueuePage),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '**',
    title: 'Không tìm thấy trang · Dấu Xanh Hải Phòng',
    loadComponent: () => import('./core/not-found.page').then((module) => module.NotFoundPage),
  },
];
