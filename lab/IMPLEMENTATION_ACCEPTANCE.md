# Nghiệm thu lát cắt vòng đời đầy đủ — local

Cập nhật: 20/08/2026. Phạm vi này chỉ chạy local; không deploy, không sửa website đang vận hành và không di chuyển dữ liệu production.

## Xác thực và phiên

| Gate | Quy tắc đã thực thi | Bằng chứng tự động |
| --- | --- | --- |
| Identifier-first | Bước tên đăng nhập không gọi endpoint dò tài khoản; lỗi xác thực luôn chung | frontend unit + browser smoke |
| Credential | BCrypt cost 12; 15–72 ký tự; dummy hash cho username không tồn tại | `SystemApiIntegrationTest` |
| Session | Cookie server-side, session replacement khi login, idle 30 phút và absolute 12 giờ | integration + browser role smoke |
| CSRF | Login, đổi mật khẩu, logout và mọi business write cần token cookie/header; frontend lấy token mới sau session replacement | Spring integration + Angular unit + browser role smoke |
| First login | Tài khoản mới bị chặn API nghiệp vụ đến khi đổi mật khẩu bằng current password | `SystemApiIntegrationTest` |
| Logout | Audit + invalidate session + xóa session/CSRF cookie và state Angular | integration + browser smoke |
| Role/scope | Superadmin/Admin/Reviewer/Unit có route riêng; server deny-by-default và kiểm resource scope | workflow integration |
| HTTPS local | TLS 1.2/1.3, Secure/HttpOnly/SameSite cookie, HSTS/CSP | secure-local runtime probe |

Hồ sơ đóng và production gates nằm tại `modules/IDENTITY_ACCESS.md`. Gate này chốt local/UAT, không xác nhận AAL2 hoặc production authentication khi chưa có MFA/IdP và recovery.

## Vòng đời nghiệp vụ

| Gate | Quy tắc đã thực thi | Bằng chứng tự động |
| --- | --- | --- |
| Trả hồ sơ | Reviewer được phân công trả hồ sơ kèm lý do; sự kiện trả và audit cùng transaction | `WorkflowApiIntegrationTest` |
| Sửa và nộp lại | Unit chỉ sửa/nộp lại hồ sơ của chính mình khi bị trả và chiến dịch còn đúng pha | `WorkflowApiIntegrationTest` |
| Vòng 1 | Reviewer chỉ chấm case thuộc tổ/scope của mình; kết quả lưu revision và người chấm | `WorkflowApiIntegrationTest` |
| Giải trình | Chỉ dòng bị giảm điểm mới mở giải trình; Unit nhập nội dung và link minh chứng bổ sung | `WorkflowApiIntegrationTest` |
| Vòng 2 | Reviewer nhìn đồng thời điểm vòng 1, giải trình và minh chứng trước khi chốt | `WorkflowApiIntegrationTest` |
| Snapshot cuối | Chỉ tạo khi mọi dòng đã hoàn tất vòng 2; lưu bản sao bất biến của đơn vị, dòng, điểm, actor, revision và SHA-256 | `WorkflowApiIntegrationTest` |
| Bốn mắt | Người chuẩn bị snapshot không thể tự phê duyệt; actor có quyền thứ hai mới duyệt/công bố | domain test + `WorkflowApiIntegrationTest` |
| Export đối soát | Chỉ xuất từ snapshot cuối; workbook có Tổng hợp đơn vị, Chi tiết dòng chấm và metadata/digest | `WorkflowApiIntegrationTest` + kiểm tra workbook specimen |

Tổng điểm một đơn vị được cố định theo snapshot: `điểm cơ bản được duyệt + min(điểm thưởng được duyệt, 25)`. Catalog nguồn là 55 dòng, 83 điểm cơ bản, 69 điểm thưởng thô tối đa và trần điểm thưởng 25.

## Tải và khả năng truy cập

- `CapacityLoadIntegrationTest` tạo chính xác `134 đơn vị × 55 dòng = 7.370` dòng kết quả và `14.740` quyết định hai vòng trên PostgreSQL thật; budget local: snapshot dưới 20 giây, export dưới 10 giây, 20 mẫu đọc kết quả sau 3 warm-up có p95 dưới 250 ms. Baseline full-check cuối ngày 20/08/2026: p50 17,41 ms, p95 22,34 ms, max 29,91 ms, phản hồi 38.377 byte. Test luôn in dòng `PERF_BASELINE` để lưu làm release evidence.
- Browser smoke dùng `axe-core` với bộ rule WCAG 2.0 A/AA, WCAG 2.1 A/AA và WCAG 2.2 AA trên đăng nhập, vòng đời, bảng điểm, tài khoản, cơ cấu và kết quả.
- Harness kiểm tra keyboard focus ban đầu, skip-link đi tới vùng nội dung, guard, logout, desktop/mobile và không có page/console error ngoài 401 được chủ động thử.
- Đây là cổng hồi quy tự động, không thay thế phiên nghiệm thu có người dùng bàn phím và trình đọc màn hình trên thiết bị thật trước production.

## An toàn vận hành

- Stack HTTPS local tách riêng tại `4319`, TLS 1.2/1.3, secure cookie, HSTS và security headers; chứng thư tự ký chỉ dùng diễn tập.
- Database/bootstrap password được mount bằng Docker secrets và Spring config tree; image và biến môi trường backend không chứa giá trị secret.
- Script backup off-host kiểm tra checksum, restore vào database cô lập và xác nhận catalog/Flyway trước khi hủy container diễn tập.
- Production vẫn cần chứng thư CA, secret manager/KMS và đích backup thực sự ngoài máy; repository cố ý không chứa lệnh deploy.

## Lệnh cổng chất lượng

```powershell
.\scripts\check.ps1
.\ops\secure-local.ps1 -Start
$env:ADMIN_BASE_URL='https://127.0.0.1:4319'
$env:ADMIN_PASSWORD=(Get-Content -Raw '.tmp\secure-local-superadmin.password').Trim()
python .\app\frontend\e2e\admin-smoke.py
.\ops\backup-offhost-drill.ps1 -OffHostDestination '<đích-ngoài-workspace>' -ComposeProject neko-doan-secure-local -ComposeFiles @('compose.yaml','compose.secure-local.yaml')
```
