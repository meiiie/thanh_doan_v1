# Module `scorecard-assignment`

Cập nhật: 21/08/2026
Trạng thái: **đã nối roster nguồn và hoàn tất regression local; chờ chủ dự án chốt UX local/UAT**.

## Phạm vi

Module sở hữu việc đọc catalog nguồn, trình bày Bảng Tổng, phân bổ tiêu chí cho khối/đơn vị, phân công Tổ và cán bộ thẩm định, kiểm tra readiness và ban hành snapshot phân công. Module không sở hữu nội dung tự chấm, quyết định chấm, snapshot kết quả cuối hoặc quản trị tài khoản.

## Mô hình nghiệp vụ

```text
Chiến dịch
  → Bảng Tổng (27 tiêu chí / 55 dòng chấm)
    → chọn tiêu chí
      → Phân bổ: tiêu chí áp dụng cho khối/đơn vị nào
      → Phân công: Tổ/cán bộ nào chịu trách nhiệm chấm
    → kiểm tra đủ điều kiện
    → ban hành snapshot bất biến
```

- Bảng Tổng là nguồn chuẩn duy nhất; các bảng làm việc của khối được chiếu từ snapshot đã ban hành.
- Một dòng UI đại diện một tiêu chí nghiệp vụ; inspector giữ chi tiết dòng chấm và command.
- `Phân bổ` và `Phân công` là hai command độc lập trên selection, không phải route sidebar.
- `Tổ & cán bộ` là projection tham chiếu của cùng roster/assignment, không phải module quản trị nhân sự.
- Phiên bản đã ban hành không được sửa; thay đổi tiếp theo cần phiên bản mới.

## Quyền

- `CAMPAIGN_ADMIN`: đọc và thay đổi assignment trong campaign/scope được cấp; ban hành khi có capability tương ứng.
- `SUPERADMIN`: toàn quyền trên mọi campaign nhưng dùng cùng hợp đồng và invariant.
- `REVIEWER` và `UNIT_MEMBER`: không được gọi command cấu hình; chỉ nhận projection công việc thuộc scope sau khi ban hành.
- Backend kiểm quyền deny-by-default theo request và resource scope; ẩn control ở frontend không thay thế authorization server.

## Hợp đồng

- `GET /api/scorecards/current`: catalog đã chuẩn hóa và provenance workbook.
- `GET /api/assignments/current`: workbench phân bổ/phân công hiện hành.
- `PUT /api/assignments/current/groups/{groupId}`: lưu một tiêu chí với optimistic version.
- `PUT /api/assignments/current/bulk`: áp dụng một cấu hình cho selection.
- `POST /api/assignments/current/release`: ban hành snapshot bằng idempotency key.

OpenAPI là nguồn DTO biên duy nhất. Application service phụ thuộc `AssignmentGateway`; domain/application không phụ thuộc Spring, JDBC hoặc HTTP.

## Dữ liệu và trạng thái

- Runtime seed giữ campaign, provenance, 27 tiêu chí, 55 dòng, 4 khối và số lượng 134 đơn vị có nguồn. Roster chi tiết được provision riêng từ workbook khách hàng, không hard-code trong migration.
- Roster local hiện có 5 Tổ, 5 người theo dõi Tổ (SubAdmin1), 20 cán bộ chấm (SubAdmin2) và 134 đơn vị; mỗi record lưu SHA-256/sheet/dòng nguồn. Assignment vẫn để trống mặc định, nên UI hiển thị đúng `Chưa phân bổ` / `Chưa phân công`.
- Assignment chỉ ready khi có ít nhất một phạm vi, một Tổ và một cán bộ hợp lệ.
- `review.team.overview` chỉ cấp phạm vi theo dõi Tổ cho SubAdmin1, không tạo quyền duyệt/chấm thay. Mọi Reviewer đang hoạt động và thuộc đúng Tổ, gồm cả SubAdmin1, chỉ trở thành người chấm khi Admin gán trực tiếp trên criterion assignment.
- Write nghiệp vụ và audit cùng transaction; optimistic version ngăn ghi đè im lặng.
- Workload không lưu cứng: số tiêu chí lấy từ assignment plan; số lượt đơn vị dự kiến là tổng `documentedUnitCount` của các khối áp dụng trên từng plan.

## UX đã khóa bằng regression

- Sidebar Admin chiến dịch có đúng năm đích: Tổng quan, Bảng Tổng, Phiên bản, Kết quả & đối soát, Tổ & cán bộ.
- Header hiển thị phase, provenance và các số liệu `55 dòng tính điểm · 4 khối · 134 đơn vị` không dùng KPI card.
- Tab lọc đếm số tiêu chí thật `27 / 22 / 5`; tìm kiếm theo mã hoặc nội dung; pagination 10 tiêu chí/trang.
- Dropdown trạng thái tách bốn tập không chồng lấn: tất cả, chưa phân bổ, đã có phạm vi nhưng chưa phân công, và đã hoàn tất.
- Selection mới làm hiện action bar. `Phân bổ` chỉ mở fieldset phạm vi; `Phân công` chỉ mở fieldset Tổ/cán bộ.
- Drawer hiển thị người theo dõi Tổ dưới dạng context, toàn bộ thành viên, workload, số cán bộ chấm khả dụng/tài khoản khóa và trạng thái không còn người nhận việc. `Cán bộ chấm` mới là assignment; `Xem Tổ` mở projection chỉ đọc với đúng Tổ đang chọn. Bulk phạm vi giữ nguyên assignment; bulk người chấm giữ nguyên applicability.
- Trang `Tổ & cán bộ` có hai chế độ Tổ/cán bộ, search chung, giữ tài khoản khóa để đọc lịch sử và không có command tạo/sửa/xóa/khóa tài khoản.
- Visual target và implementation được so cùng viewport 1672 × 941; desktop/mobile, axe WCAG 2.2 AA, keyboard, overflow và console error nằm trong harness.

## Điều còn mở trước khi chốt module

1. Chủ dự án xác nhận trực quan Bảng Tổng và từ ngữ command trên bản local.
2. Khách hàng xác nhận roster/provenance và quy tắc SubAdmin1/SubAdmin2 đã ánh xạ.
3. UAT xác nhận rule readiness, quyền ban hành và cách tạo phiên bản sửa đổi.
4. Staging kiểm tra concurrency, audit và performance với dữ liệu tương đương production.
