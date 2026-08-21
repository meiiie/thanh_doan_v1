# Sổ đăng ký trạng thái module

Cập nhật: 21/08/2026. Sổ này là điểm vào để biết module nào đã **chốt local/UAT**, module nào còn đang thẩm định UX và module nào còn phụ thuộc dữ liệu hoặc quyết định production.

## Ý nghĩa trạng thái

- **Chốt local/UAT:** luồng, hợp đồng và cổng hồi quy của phạm vi local đã ổn định; thay đổi tiếp theo cần quyết định mới trong `../DECISION_LOG.md`.
- **Đã hiện thực, chưa chốt UX:** backend và UI chạy được nhưng chưa được chủ dự án duyệt là trải nghiệm cuối.
- **Chờ dữ liệu thật:** không được thay bằng tên người, đơn vị, điểm hoặc minh chứng giả trong runtime chuẩn.
- **Cổng production:** không cản trở nghiên cứu local nhưng bắt buộc giải quyết trước một lần phát hành thật.

## Bản đồ hiện hành

| Module | Trạng thái | Bề mặt chính | Điều còn mở |
| --- | --- | --- | --- |
| `identity-access` | **Chốt local/UAT** | login, phiên, CSRF, đổi mật khẩu lần đầu, logout, role/scope | Chọn IdP/MFA, recovery và thu hồi phiên tập trung trước production |
| `organization-directory` | Đã provision roster nguồn local; chờ ký xác nhận | Superadmin · Cơ cấu tổ chức | Xác nhận roster/provenance và quy trình bàn giao credential |
| `campaign-lifecycle` | Đã hiện thực, chưa chốt UX | Superadmin/Admin · Vòng đời | Từ ngữ phê duyệt và quyền mở lại trong UAT thật |
| [`scorecard-assignment`](SCORECARD_ASSIGNMENT.md) | **Đã nối roster nguồn; chờ chủ dự án chốt UX** | Admin · Bảng Tổng | Xác nhận visual/UAT và rule readiness/ban hành |
| `submission` | Đã hiện thực, chưa chốt UX | Unit · Việc cần thực hiện | Trạng thái rỗng/thực tế, nhập link minh chứng và trả hồ sơ |
| [`review`](REVIEW_AND_RESULTS.md) | **Chốt local/UAT** | Admin · Điều hành chấm; Reviewer · Công việc chấm | Kiểm chứng với dữ liệu UAT thật trước khi đóng băng copy và mật độ |
| [`final-result`](REVIEW_AND_RESULTS.md) | **Chốt local/UAT** | Unit · Giải trình/Kết quả cuối; Admin · Kết quả và đối soát | Staging, phê duyệt nghiệp vụ công bố và diễn tập export thật |
| `operations` | Local release-ready | TLS, secret, backup, SBOM, scan, load | Staging/UAT, CA/domain, secret manager và off-host thật |

Chi tiết module xác thực nằm tại [`IDENTITY_ACCESS.md`](IDENTITY_ACCESS.md); hợp đồng chấm và kết quả nằm tại [`REVIEW_AND_RESULTS.md`](REVIEW_AND_RESULTS.md). Mỗi module tiếp theo chỉ chuyển sang **chốt local/UAT** sau khi có cùng cấu trúc: phạm vi, state flow, quyền, hợp đồng, dữ liệu, test, giới hạn và quyết định đóng.
