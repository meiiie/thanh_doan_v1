import { Routes } from '@angular/router';
import { authenticatedGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Đăng nhập · Neko Đoàn',
    loadComponent: () => import('./core/auth/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'change-password',
    canActivate: [authenticatedGuard],
    title: 'Đổi mật khẩu · Neko Đoàn',
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
        title: 'Vòng đời chiến dịch · Neko Đoàn',
        loadComponent: () =>
          import('./features/campaign/campaign-status.page').then(
            (module) => module.CampaignStatusPage,
          ),
      },
      {
        path: 'scorecards',
        title: 'Bảng điểm và phân công · Neko Đoàn',
        loadComponent: () =>
          import('./features/scorecard/scorecard-catalog.page').then(
            (module) => module.ScorecardCatalogPage,
          ),
      },
      {
        path: 'versions',
        title: 'Phiên bản Bảng Tổng · Neko Đoàn',
        loadComponent: () =>
          import('./features/scorecard/scorecard-versions.page').then(
            (module) => module.ScorecardVersionsPage,
          ),
      },
      {
        path: 'review-control',
        title: 'Điều hành chấm · Neko Đoàn',
        loadComponent: () =>
          import('./features/review/review-control.page').then(
            (module) => module.ReviewControlPage,
          ),
      },
      {
        path: 'results',
        title: 'Kết quả và đối soát · Neko Đoàn',
        loadComponent: () =>
          import('./features/result/final-results.page').then((module) => module.FinalResultsPage),
      },
      {
        path: 'accounts',
        title: 'Tài khoản và quyền · Neko Đoàn',
        loadComponent: () =>
          import('./admin/pages/accounts.page').then((module) => module.AdminAccountsPage),
      },
      {
        path: 'structure',
        title: 'Cơ cấu tổ chức · Neko Đoàn',
        loadComponent: () =>
          import('./features/organization/organization-directory.page').then(
            (module) => module.OrganizationDirectoryPage,
          ),
      },
      {
        path: 'teams',
        title: 'Tổ và cán bộ · Neko Đoàn',
        loadComponent: () =>
          import('./features/organization/team-directory.page').then(
            (module) => module.TeamDirectoryPage,
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
        title: 'Bảng Tổng · Neko Đoàn',
        loadComponent: () =>
          import('./features/scorecard/scorecard-catalog.page').then(
            (module) => module.ScorecardCatalogPage,
          ),
      },
      {
        path: 'lifecycle',
        title: 'Vòng đời chiến dịch · Neko Đoàn',
        loadComponent: () =>
          import('./features/campaign/campaign-status.page').then(
            (module) => module.CampaignStatusPage,
          ),
      },
      {
        path: 'versions',
        title: 'Phiên bản Bảng Tổng · Neko Đoàn',
        loadComponent: () =>
          import('./features/scorecard/scorecard-versions.page').then(
            (module) => module.ScorecardVersionsPage,
          ),
      },
      {
        path: 'review-control',
        title: 'Điều hành chấm · Neko Đoàn',
        loadComponent: () =>
          import('./features/review/review-control.page').then(
            (module) => module.ReviewControlPage,
          ),
      },
      {
        path: 'results',
        title: 'Kết quả và đối soát · Neko Đoàn',
        loadComponent: () =>
          import('./features/result/final-results.page').then((module) => module.FinalResultsPage),
      },
      {
        path: 'teams',
        title: 'Tổ và cán bộ · Neko Đoàn',
        loadComponent: () =>
          import('./features/organization/team-directory.page').then(
            (module) => module.TeamDirectoryPage,
          ),
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
        title: 'Việc cần thực hiện · Neko Đoàn',
        loadComponent: () =>
          import('./unit/pages/unit-tasks.page').then((module) => module.UnitTasksPage),
      },
      {
        path: 'results',
        title: 'Giải trình · Neko Đoàn',
        loadComponent: () =>
          import('./unit/pages/unit-results.page').then((module) => module.UnitResultsPage),
      },
      {
        path: 'final',
        title: 'Kết quả cuối · Neko Đoàn',
        loadComponent: () =>
          import('./unit/pages/unit-final-results.page').then(
            (module) => module.UnitFinalResultsPage,
          ),
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
        title: 'Công việc chấm · Neko Đoàn',
        loadComponent: () =>
          import('./reviewer/pages/review-queue.page').then((module) => module.ReviewQueuePage),
      },
      {
        path: 'history',
        title: 'Lịch sử chấm · Neko Đoàn',
        data: { criterionTab: 'completed' },
        loadComponent: () =>
          import('./reviewer/pages/review-queue.page').then((module) => module.ReviewQueuePage),
      },
      {
        path: 'results',
        title: 'Kết quả chấm · Neko Đoàn',
        data: { criterionTab: 'adjusted' },
        loadComponent: () =>
          import('./reviewer/pages/review-queue.page').then((module) => module.ReviewQueuePage),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: '**',
    title: 'Không tìm thấy trang · Neko Đoàn',
    loadComponent: () => import('./core/not-found.page').then((module) => module.NotFoundPage),
  },
];
