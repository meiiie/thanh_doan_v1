# Audit hiện trạng — bảng điểm Excel-first

Ngày audit: 13/08/2026  
Route: `/admin/scorecard-templates`  
Mục tiêu người dùng: Admin Hải Phòng phân công 55 dòng chấm cho đúng tổ và cán bộ, đồng thời vẫn đối chiếu được toàn bộ workbook nguồn.

## Các bước đã kiểm tra

| Bước | Ảnh | Sức khỏe | Quan sát chính |
| --- | --- | --- | --- |
| 1. Mở sheet chính | [01-core-sheet.png](01-core-sheet.png) | Cần sửa cấu trúc | Đủ dữ liệu nhưng một bảng trộn trường của Admin, đơn vị, tổ thẩm định và hệ thống; người dùng không thấy hành động ưu tiên. Vị trí cuộn ngang được giữ khi đổi sheet nên cột nội dung có thể bị cắt. |
| 2. Mở sheet điểm thưởng | [02-bonus-sheet.png](02-bonus-sheet.png) | Đúng dữ liệu, khó thao tác | Đủ 10 header và 25 dòng, nhưng chiều ngang lớn làm mất ngữ cảnh. Các ô không thuộc việc của Admin vẫn hiện như có thể thao tác. |
| 3. Mở Luồng và công thức | [03-workflow-drawer.png](03-workflow-drawer.png) | Hữu ích nhưng tách khỏi việc | Giải thích đúng 4 chủ thể và công thức, nhưng không biến hiểu biết đó thành chế độ làm việc hay quyền hiển thị trên bảng. |

## Điểm mạnh

- Toàn bộ 12/10 header và 55 dòng chấm đã có trên web, đủ làm oracle đối chiếu workbook.
- Mỗi control có tên truy cập theo mã tiêu chí; bảng, tab và drawer có semantic cơ bản tốt.
- Công thức tổng hợp, trần thưởng, kiểm tra URL và lý do trừ điểm đã phản ứng theo dữ liệu nhập.

## Rủi ro UX chính

1. **Trộn actor:** Admin nhìn và có thể nhập cả `Tự chấm`, `Được chấm`, `Link minh chứng`, `Lý do trừ điểm`; điều này trái với luồng phân quyền của PDF.
2. **Không có next action:** tiêu đề nói “bảng điểm”, nhưng không nói Admin đang ở bước tiếp nhận, phân công hay rà soát.
3. **Không có thao tác hàng loạt:** phân công 55 dòng bằng từng ô là chậm và dễ lệch tổ/cán bộ.
4. **Không có trạng thái hoàn thành:** không biết còn bao nhiêu dòng chưa có cả tổ và cán bộ.
5. **Bảng nguồn đang là giao diện chính:** horizontal scroll phù hợp đối chiếu Excel nhưng không phù hợp tác vụ thường xuyên.

## Rủi ro accessibility cần kiểm tra thêm

- Chưa kiểm thử bằng screen reader; ảnh chỉ xác nhận được tên control và cấu trúc DOM.
- Một số control trong lưới có chiều cao theo ô nhưng bảng rất rộng, gây chi phí điều hướng bàn phím lớn.
- Cần kiểm tra focus sau thao tác hàng loạt, thông báo lưu và drawer rà soát.

## Quyết định sau audit

- Giữ nguyên chế độ `Đối chiếu Excel` làm chuẩn nguồn, không xóa header.
- Mặc định mở chế độ `Phân công` chỉ chứa dữ liệu và hành động của Admin.
- Thêm chọn nhiều dòng, gán tổ/cán bộ hàng loạt, trạng thái `Chưa đủ/Đã phân công`, lưu nháp local và bước rà soát.
- Không đưa tự chấm và thẩm định vào chế độ Admin; hai actor này sẽ có workspace riêng ở lát cắt sau.

