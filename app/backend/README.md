# Spring Boot modular monolith

Backend local chạy tại `127.0.0.1:8081`; các bề mặt chạy thật gồm:

- `identity-access`: đăng nhập phiên, CSRF, danh tính hiện tại, tạo/list tài khoản và audit.
- `campaign`: trạng thái readiness lấy trực tiếp từ database.
- `scorecard`: 27 hạng mục, 55 dòng chấm và provenance được sinh từ workbook khách hàng.
- `assignment`: phân khối, Tổ theo dõi/cán bộ chấm và snapshot ban hành.
- `submission`: nháp, nộp lại và giải trình theo đúng đơn vị của phiên.
- `review`: trả hồ sơ, chấm vòng 1/vòng 2 theo đúng Tổ và cán bộ.
- `results`: snapshot bất biến, bốn mắt, công bố và export đối soát.

Chạy kiểm tra:

```powershell
mvn clean verify
```

Hai gate PostgreSQL (`PostgresMigrationIntegrationTest`, `CapacityLoadIntegrationTest`) dùng Testcontainers. `scripts/check.ps1` từ chối kết quả khi Docker không chạy để tránh báo xanh trong khi hai gate bị skip.

Tài khoản Superadmin bootstrap chỉ được tạo khi có `APP_BOOTSTRAP_PASSWORD`; `scripts/dev.ps1` sinh mật khẩu local ngẫu nhiên và lưu ngoài source tại `.tmp/local-superadmin.password`. Script bật profile `local`, lưu H2 dạng file tại `.tmp/campaign-local.mv.db`; test vẫn dùng database in-memory cô lập. Tài khoản do Superadmin tạo bị backend chặn dữ liệu nghiệp vụ cho đến khi hoàn thành bước đổi mật khẩu lần đầu.
