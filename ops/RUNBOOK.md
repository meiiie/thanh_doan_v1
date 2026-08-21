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

Stack `neko-doan-secure-local` đọc mật khẩu PostgreSQL/bootstrap bằng Docker secrets và Spring `configtree`, tạo chứng thư tự ký chỉ cho `127.0.0.1`, bật secure cookie và đặt reverse proxy TLS tại `https://127.0.0.1:4319`. Kiểm tra container backend không lộ giá trị secret trong `docker inspect`; chỉ đường dẫn `/run/secrets/...` được phép xuất hiện.

Production phải thay chứng thư tự ký bằng chứng thư CA tin cậy và thay file secret local bằng secret manager/KMS của nền tảng. Không sao chép thư mục `.tmp/secrets` lên máy chủ.

## Tài khoản duyệt từng phân luồng local

Đây là **hai chế độ chạy của cùng một codebase**, không phải hai sản phẩm. Không dùng chéo database hoặc mật khẩu Superadmin:

| Chế độ | Mục đích | Dữ liệu/hạ tầng | Ai sử dụng |
| --- | --- | --- | --- |
| `http://127.0.0.1:4317/login` | Vòng lặp code và UX có hot reload | H2 file local; `.tmp/local-superadmin.password` | Developer; không dùng ký UAT |
| `https://127.0.0.1:4319/login` | Kiểm định release candidate | Production build, PostgreSQL 18, TLS; `.tmp/secure-local-superadmin.password` | QA/UAT và kiểm định bảo mật |

Chủ dự án chỉ cần dùng `4317` trong giai đoạn cùng developer chỉnh UX hiện tại. Trước khi chốt release candidate, chuyển sang `4319`; không yêu cầu người dùng nghiệp vụ ghi nhớ đồng thời hai môi trường.

Sau khi stack HTTPS xanh, tạo hoặc xác minh tài khoản UAT local:

```powershell
.\ops\provision-local-uat-accounts.ps1
```

Script chỉ nhận loopback URL, tạo một đơn vị `LAB-DHCD`, một tổ `LAB-TO-01` và ba tài khoản `uat.admin`, `uat.reviewer`, `uat.unit.dhcd`; sau đó đổi mật khẩu khởi tạo, đăng nhập lại và probe API đúng vai trò. Manifest chứa password ngẫu nhiên nằm tại `.tmp/local-uat-accounts.json` và bị Git loại trừ. Superadmin tiếp tục đọc password riêng tại `.tmp/secure-local-superadmin.password`.

Kiểm tra cả route, heading, axe, overflow, console và logout của ba workspace:

```powershell
$env:ADMIN_BASE_URL='https://127.0.0.1:4319'
npm --prefix .\app\frontend run test:e2e:roles
```

Đây là dữ liệu kiểm định có nhãn `UAT local`, không phải seed nghiệp vụ và không được sao chép sang staging/production. Hồ sơ luồng và production gates nằm tại `../lab/modules/IDENTITY_ACCESS.md`.

## Provision roster nguồn local

Roster khách hàng không nằm trong migration và không dùng chung với fixture `LAB-*`. Quy trình hiện hành:

1. Đọc `Thông tin Website.xlsx` bằng builder spreadsheet local để tạo manifest `.tmp/source-roster-provisioning/manifest.json` và sổ bàn giao trong `outputs/<task-id>/`.
2. Khởi động stack developer `4317/8081` rồi chạy:

```powershell
.\ops\provision-source-roster.ps1
```

Script chỉ nhận loopback URL, đối chiếu code/username hiện hữu, từ chối xung đột danh tính hoặc provenance, rồi tạo phần còn thiếu qua API Superadmin. Chạy lại phải báo `created teams/organizations/accounts = 0` và vẫn xác minh `5 Tổ / 134 đơn vị / 163 tài khoản nguồn + 1 Superadmin hiện hữu`.

Không commit manifest, result hoặc sổ credential. Chỉ chuyển sổ bàn giao qua kênh nội bộ được phê duyệt; mọi tài khoản tạo mới phải đổi mật khẩu lần đầu. Khi nguồn thay đổi, lưu phiên bản cũ theo quy trình hồ sơ và tạo manifest mới; không sửa hash để ép importer chấp nhận.

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
.\ops\restore.ps1 -Backup .\backups\neko-doan-YYYYMMDD-HHMMSS.dump -ConfirmDatabaseReplace
```

Restore thay thế dữ liệu hiện tại, nên chỉ thực hiện trong maintenance window sau khi đã tạo backup mới và chặn ghi.

Diễn tập backup ra đích nằm ngoài workspace và restore vào PostgreSQL cô lập:

```powershell
.\ops\backup-offhost-drill.ps1 `
  -OffHostDestination 'D:\neko-doan-backup-drill' `
  -ComposeProject neko-doan-secure-local `
  -ComposeFiles @('compose.yaml','compose.secure-local.yaml')
```

Harness từ chối đích nằm trong workspace, tạo dump kèm SHA-256, sao chép ra đích đã chỉ định, restore vào container PostgreSQL dùng một lần, rồi đối chiếu 55 dòng bảng điểm và phiên bản Flyway hiện hành. Đích local ngoài workspace chỉ kiểm tra adapter/quy trình; nghiệm thu production phải dùng UNC, volume từ máy backup hoặc object-storage mount thực sự nằm ngoài máy ứng dụng.

## Supply chain, performance và staging/UAT

`scripts/check.ps1` tạo CycloneDX Java SBOM, chạy gate giấy phép cho Java/frontend/contract tools, dependency audit, PostgreSQL migrations và baseline tải `134 × 55`. CI còn quét SBOM và cả hai container image bằng Trivy; bốn gate này độc lập và không được thay thế lẫn nhau.

Baseline tải in `PERF_BASELINE` với p50/p95/max của 20 lần đọc snapshot đầy đủ sau warm-up; local budget p95 là 250 ms. Baseline full-check 20/08/2026 trên Docker Desktop là p50 18,03 ms, p95 21,78 ms, max 22,55 ms cho phản hồi 38.377 byte. Số local phát hiện regression, còn release phải đo lại trên staging tương đương production và lưu hardware/image digest cùng kết quả.

Trước UAT, thực hiện checklist và smoke script trong `STAGING_UAT.md`. Repository không deploy; thiếu staging URL, off-host restore report và chữ ký người dùng thì chỉ được gọi là local release-ready.

## Gói VPS Linux

Overlay `compose.vps.yaml` và bộ script `ops/vps/` đã khóa mô hình single-node: Caddy là public edge duy nhất; frontend, backend và PostgreSQL không publish cổng; release image dùng digest; secret nằm ngoài repository; có preflight, HTTPS smoke, systemd, backup và restore drill cô lập. Hướng dẫn cài đặt, first bootstrap, rollback và cổng go-live nằm tại [`vps/README.md`](vps/README.md).

Repository **không có CD tự deploy** vì chưa chốt VPS, registry, domain, secret manager/off-host repository và approval owner. CI chỉ validate gói, build/scan image; triển khai phải là một thao tác được phê duyệt trên host.

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
