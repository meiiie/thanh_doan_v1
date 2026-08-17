# Nghiệm thu lát cắt vòng đời đầy đủ — local

Cập nhật: 15/08/2026. Phạm vi này chỉ chạy local; không deploy, không sửa website đang vận hành và không di chuyển dữ liệu production.

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

- `CapacityLoadIntegrationTest` tạo chính xác `134 đơn vị × 55 dòng = 7.370` dòng kết quả và `14.740` quyết định hai vòng trên PostgreSQL thật; budget local: snapshot dưới 20 giây, export dưới 10 giây.
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
.\ops\backup-offhost-drill.ps1 -Destination '<đích-ngoài-workspace>' -ComposeProject campaign-secure-local -ComposeFiles @('compose.yaml','compose.secure-local.yaml')
```
