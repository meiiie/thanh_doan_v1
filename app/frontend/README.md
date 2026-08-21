# Angular local frontend

Angular 22 chạy tại `127.0.0.1:4317`, proxy `/api` sang Spring Boot `8081`.

Các route hiện có:

- `/login`: đăng nhập phiên thật.
- `/superadmin/lifecycle`, `/superadmin/scorecards`, `/superadmin/results`, `/superadmin/accounts`, `/superadmin/structure`.
- `/admin/scorecard-templates`, `/admin/lifecycle`, `/admin/results`.
- `/unit/tasks`, `/reviewer/queue`.

Superadmin được phép vào mọi workspace. Các vai trò khác được chặn ở router và kiểm tra lại ở backend. Tài khoản mới được điều hướng tới `/change-password`; backend vẫn là hàng rào bắt buộc. Frontend không chứa danh sách người dùng, điểm, minh chứng hoặc kết quả mẫu.

```powershell
npm run check
npm run test:e2e  # yêu cầu scripts/dev.ps1 đang chạy
```

Nhận diện phát hành nằm ở `public/brand/neko-doan-v1/`; nguồn tự chứa, provenance và preview nằm tại `../../docs/assets/brand/neko-doan-v1/`.

```powershell
npm run brand:sync   # render + đồng bộ derivative từ nguồn đã duyệt
npm run brand:check  # hash, kích thước, manifest, metadata, robots và Nginx
```

Đây là cổng nội bộ: HTML, `robots.txt` và Nginx `X-Robots-Tag` cùng chặn index. Không thêm canonical, sitemap hay public JSON-LD cho tới khi có lớp website public và origin HTTPS được duyệt.
