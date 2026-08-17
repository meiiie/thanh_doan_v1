# Runbook vận hành

## Phạm vi

Stack hiện tại là một modular monolith: Angular được Nginx phục vụ, Spring Boot xử lý API và PostgreSQL lưu dữ liệu. Chỉ frontend được bind ra máy chủ; backend, metrics và database nằm trong mạng nội bộ Docker.

## Khởi tạo local production-like

1. Sao chép `.env.example` thành `.env` và thay cả hai mật khẩu bằng chuỗi ngẫu nhiên riêng.
2. Giữ `APP_SESSION_COOKIE_SECURE=false` chỉ khi kiểm tra qua HTTP local.
3. Chạy `docker compose up --build -d` rồi kiểm tra `docker compose ps`.
4. Mở `http://127.0.0.1:4318/login`, đăng nhập Superadmin và đổi mật khẩu ngay.
5. Đặt `APP_BOOTSTRAP_ENABLED=false`, xóa `APP_BOOTSTRAP_PASSWORD` khỏi secret store rồi chạy lại backend.

Production phải kết thúc TLS ở reverse proxy/load balancer, truyền đúng `X-Forwarded-Proto=https`, đặt `APP_SESSION_COOKIE_SECURE=true` và chỉ cho mạng giám sát truy cập cổng management 9090.

## Diễn tập HTTPS và secret local

Không đưa secret vào biến môi trường của backend. Dùng stack diễn tập riêng:

```powershell
.\ops\secure-local.ps1 -Start
```

Stack `campaign-secure-local` đọc mật khẩu PostgreSQL/bootstrap bằng Docker secrets và Spring `configtree`, tạo chứng thư tự ký chỉ cho `127.0.0.1`, bật secure cookie và đặt reverse proxy TLS tại `https://127.0.0.1:4319`. Kiểm tra container backend không lộ giá trị secret trong `docker inspect`; chỉ đường dẫn `/run/secrets/...` được phép xuất hiện.

Production phải thay chứng thư tự ký bằng chứng thư CA tin cậy và thay file secret local bằng secret manager/KMS của nền tảng. Không sao chép thư mục `.tmp/secrets` lên máy chủ.

## Cổng sức khỏe và quan sát

- Readiness: `http://backend:9090/actuator/health/readiness`
- Liveness: `http://backend:9090/actuator/health/liveness`
- Prometheus: `http://backend:9090/actuator/prometheus`
- Mọi phản hồi API có `X-Correlation-ID`; log backend ghi cùng mã này.

Không công khai cổng 8081, 9090 hoặc 5432 ra Internet.

## Backup và restore

Tạo backup PostgreSQL custom-format:

```powershell
.\ops\backup.ps1
```

File dump và SHA-256 nằm trong `backups/` và bị loại khỏi Git. Sao chép chúng sang kho lưu trữ mã hóa, tách khỏi máy ứng dụng. Kiểm tra restore định kỳ trên môi trường riêng:

```powershell
.\ops\restore.ps1 -Backup .\backups\campaign-YYYYMMDD-HHMMSS.dump -ConfirmDatabaseReplace
```

Restore thay thế dữ liệu hiện tại, nên chỉ thực hiện trong maintenance window sau khi đã tạo backup mới và chặn ghi.

Diễn tập backup ra đích nằm ngoài workspace và restore vào PostgreSQL cô lập:

```powershell
.\ops\backup-offhost-drill.ps1 `
  -Destination 'D:\campaign-backup-drill' `
  -ComposeProject campaign-secure-local `
  -ComposeFiles @('compose.yaml','compose.secure-local.yaml')
```

Harness từ chối đích nằm trong workspace, tạo dump kèm SHA-256, sao chép ra đích đã chỉ định, restore vào container PostgreSQL dùng một lần, rồi đối chiếu 55 dòng bảng điểm và Flyway từ phiên bản 6. Đích local ngoài workspace chỉ kiểm tra adapter/quy trình; nghiệm thu production phải dùng UNC, volume từ máy backup hoặc object-storage mount thực sự nằm ngoài máy ứng dụng.

## Quy trình phát hành

1. `./scripts/check.ps1` xanh, gồm unit/API test, migration trên PostgreSQL thật và production frontend build.
2. `npm audit --omit=dev --audit-level=high` không có lỗ hổng mức high/critical.
3. CI build được cả hai container từ commit phát hành.
4. Chụp backup, ghi migration version và image digest.
5. Triển khai canary hoặc maintenance window; đợi readiness xanh trước khi nhận traffic.
6. Chạy smoke: login, đọc bảng điểm, tạo dữ liệu danh mục không phá hủy và kiểm tra audit/correlation ID.
7. Rollback ứng dụng bằng image digest trước đó. Chỉ rollback database từ backup khi migration không tương thích và đã được người chịu trách nhiệm dữ liệu phê duyệt.

## Cảnh báo chưa được phép bỏ qua

- Chưa có chứng thư TLS/domain production thì không mở dịch vụ ra ngoài.
- Chưa có lịch backup ngoài máy và bài kiểm tra restore thì chưa gọi là production-ready.
- Chưa có Chrome DevTools MCP nên Core Web Vitals vẫn phải được đo ở staging trước release.
- Ứng dụng hiện vận hành một backend replica với session trong bộ nhớ; không scale ngang trước khi chuyển session sang kho dùng chung hoặc dùng sticky session có chủ đích.
