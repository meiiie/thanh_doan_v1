# Runbook vận hành

## 1. Triển khai lần đầu

1. Chạy `npm ci` rồi `npm run check`; không triển khai nếu một gate thất bại.
2. Triển khai dưới dạng **private Site**, binding D1 tên `DB`.
3. Chủ sở hữu Site truy cập trước. Nếu chưa có tài khoản production, identity này
   được tạo một lần với vai trò `SUPER_ADMIN` và có audit `BOOTSTRAP_OWNER`.
4. Thêm email vào access policy của Site trước, sau đó vào **Điều hành → Thêm tài
   khoản** để ánh xạ vai trò, tổ chuyên môn hoặc đơn vị.
5. Dùng tài khoản thử của từng phạm vi để xác nhận chỉ thấy dữ liệu được phép.

Tài khoản `@doan.local` chỉ hoạt động khi host là `localhost`; production không thể
chọn chế độ demo.

## 2. Chu trình chiến dịch

| Giai đoạn | Người thao tác | Kết quả |
|---|---|---|
| Tự chấm | Đơn vị | Lưu từng tiêu chí, rồi nộp và chuyển chỉ đọc |
| Vòng 1 | Chuyên viên/tổ trưởng | Quyết định append-only; trừ điểm bắt buộc có lý do |
| Công bố vòng 1 | Admin | Đơn vị mới nhìn thấy chênh lệch |
| Giải trình | Đơn vị | Gửi giải trình và link mới theo từng tiêu chí |
| Vòng 2 | Chuyên viên/tổ trưởng | Quyết định mới; không ghi đè vòng trước |
| Đã chốt | Admin | Tạo snapshot bất biến và read-model kết quả hiện hành |

Request đầu tiên sau hạn tự chấm tự chuyển chiến dịch sang vòng 1, khóa hồ sơ nháp
và ghi `AUTO_DEADLINE_LOCKED`. Admin chỉ có thể đi theo máy trạng thái. Mở lại từ
trạng thái đã chốt bắt buộc ghi lý do; kết quả hiện hành được gỡ nhưng snapshot cũ
không bị xóa.

## 3. Kiểm tra trước mỗi lần chuyển giai đoạn

- Xuất CSV và lưu tại kho tài liệu nội bộ có versioning.
- Tải **lịch sử chốt** (JSON) để lưu cả snapshot từng tiêu chí của mọi lần chốt.
- Kiểm tra số đơn vị đã nộp/khóa, số tiêu chí đã chấm và các quyết định bị trừ.
- Đối chiếu ít nhất một golden case thủ công với workbook nguồn.
- Xem **Nhật ký** để phát hiện thao tác bất thường hoặc lặp.
- Khi chốt, hệ thống từ chối nếu bất kỳ tiêu chí nào chưa có quyết định chấm.

## 4. Sao lưu và khôi phục

- Chủ hệ thống tải **Sao lưu JSON** trước mỗi lần công bố, mở lại hoặc chốt; file
  chứa cấu hình, identity mapping, assessments, reviews, explanations, snapshots
  và audit (không chứa idempotency key tạm thời).
- Bật lịch backup D1 hằng ngày trên nền tảng khi workspace cung cấp tùy chọn đó;
  backup JSON là lớp bổ sung có thể kiểm tra độc lập, không thay thế backup D1.
- Kiểm tra khả năng restore vào môi trường tách biệt mỗi quý, không restore đè trực
  tiếp production để “thử”.
- Khi cần phục hồi, đóng quyền ghi bằng access policy, ghi thời điểm sự cố, restore
  bản gần nhất, chạy `/api/health`, rồi đối chiếu số bản ghi và snapshot trước khi mở
  lại quyền truy cập.
- Audit, review decision, explanation và final snapshot là dữ liệu lưu giữ; không
  sửa thủ công. Sai sót nghiệp vụ được khắc phục bằng quyết định mới/mở lại có lý do.

## 5. Sự cố

1. Kiểm tra `/api/health`: `status=ok`, `database=ok`.
2. Nếu chỉ một người lỗi, kiểm tra email chính xác, trạng thái active, role và scope.
3. Nếu thao tác bị từ chối, lấy error code trên UI và đối chiếu audit; không sửa D1
   trước khi xác định nguyên nhân.
4. Nếu nghi rò rỉ dữ liệu, thu hồi access policy trước, giữ nguyên log/audit, đổi
   quyền người dùng bị ảnh hưởng và lập timeline.
5. Rollback application bằng phiên bản Site trước; rollback dữ liệu chỉ dùng bản
   backup đã kiểm chứng.

## 6. Bảo trì

- Mỗi thay đổi schema: sửa `db/schema.ts`, chạy `npm run db:generate`, đọc SQL và
  chạy `npm run check` từ trạng thái sạch.
- Mỗi ba đến sáu tháng: rà `AGENTS.md`, CODEMAP, dependency, threat model và golden
  cases. Chỉ nâng major sau khi smoke + visual QA xanh.
- `npm audit --omit=dev` phải bằng 0. Advisory chỉ thuộc build tooling được ghi ở ADR
  và không được phép xuất hiện trong bundle production hoặc nhận input không tin cậy.
