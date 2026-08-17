# Kiểm định UX — Hàng chờ Tổ phụ trách

Ngày kiểm định: 13/08/2026  
Route: `/reviewer/queue`  
Phạm vi: vertical slice thẩm định vòng 1, chạy local.

## Kết quả

- Hàng chờ phân tầng Campaign → Hạng mục → Đơn vị; bảng quyết định giữ bảy trường cần thao tác trong vùng cuộn riêng và không làm tràn tài liệu ở màn hình 390 px.
- Một cán bộ mẫu nhận hai hạng mục và tám hồ sơ từ bốn trường; chuyển hạng mục không trộn bản nháp hay quyết định.
- Bộ chọn chiến dịch có hai ngữ cảnh song song; chiến dịch chưa có hồ sơ dùng empty state riêng thay vì bảng rỗng khó hiểu.
- Hai cột định danh đầu được ghim khi cuộn ngang để người chấm luôn biết đang xử lý đơn vị nào.
- Hàng chờ được lọc đồng thời theo Tổ và cán bộ phụ trách; đổi tài khoản mô phỏng không làm lẫn bản nháp.
- Nút hoàn thành bị khóa nếu chưa xác nhận minh chứng, chưa nhập điểm hợp lệ hoặc giảm điểm mà thiếu lý do.
- Dòng đã hoàn thành chuyển sang trạng thái đọc-only và vẫn giữ sau khi đổi tài khoản rồi quay lại.
- Hạng mục chỉ được gửi về Admin khi toàn bộ hồ sơ con đã hoàn tất; sau gửi nút bị khóa và hiển thị biên nhận rõ ràng.
- Semantic baseline đạt: một `h1`, có `main`, `nav`, tên truy cập cho control và `lang=vi`.
- Không có lỗi console hoặc runtime trong E2E desktop, tablet và mobile.

## Ảnh đối chiếu

- `01-review-queue-desktop.png` — desktop 1512×982.
- `02-review-queue-mobile.png` — mobile 390×844.

## Giới hạn có chủ ý

Dữ liệu đơn vị đã gửi hiện là fixture mô phỏng; việc hoàn thành chỉ lưu trong phiên trình duyệt. Chưa mở thao tác công bố vòng 1 vì chưa có backend, audit transaction và quyền phê duyệt được xác nhận.
