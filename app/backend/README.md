# Spring Boot modular monolith

Backend local chạy tại `127.0.0.1:8081` và hiện có ba bề mặt chạy thật:

- `identity-access`: đăng nhập phiên, CSRF, danh tính hiện tại, tạo/list tài khoản và audit.
- `campaign`: trạng thái readiness lấy trực tiếp từ database.
- `scorecard`: 27 hạng mục, 55 dòng chấm và provenance được sinh từ workbook khách hàng.

`submission`, `review` và `results` giữ domain/state machine nhưng không còn endpoint walking-skeleton hoặc dữ liệu runtime giả. Chúng chỉ được nối lại khi có đơn vị, phân công và hồ sơ thật.

Chạy kiểm tra:

```powershell
mvn clean test
```

Tài khoản Superadmin bootstrap chỉ được tạo khi có `APP_BOOTSTRAP_PASSWORD`; `scripts/dev.ps1` sinh mật khẩu local ngẫu nhiên và lưu ngoài source tại `.tmp/local-superadmin.password`. Script bật profile `local`, lưu H2 dạng file tại `.tmp/campaign-local.mv.db`; test vẫn dùng database in-memory cô lập. Tài khoản do Superadmin tạo bị backend chặn dữ liệu nghiệp vụ cho đến khi hoàn thành bước đổi mật khẩu lần đầu.
