# Angular local frontend

Angular 22 chạy tại `127.0.0.1:4317`, proxy `/api` sang Spring Boot `8081`.

Các route hiện có:

- `/login`: đăng nhập phiên thật.
- `/superadmin/lifecycle`, `/superadmin/scorecards`, `/superadmin/accounts`.
- `/admin/scorecard-templates`, `/admin/lifecycle`.
- `/unit/tasks`, `/reviewer/queue`.

Superadmin được phép vào mọi workspace. Các vai trò khác được chặn ở router và kiểm tra lại ở backend. Tài khoản mới được điều hướng tới `/change-password`; backend vẫn là hàng rào bắt buộc. Frontend không chứa danh sách người dùng, điểm, minh chứng hoặc kết quả mẫu.

```powershell
npm run check
npm run test:e2e  # yêu cầu scripts/dev.ps1 đang chạy
```
