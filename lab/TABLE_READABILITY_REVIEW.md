# Table Readability Review — danh mục nhập từ Excel

Ngày chốt: **12/08/2026**  
Phạm vi: màn local `Admin → Nhập danh mục`, gồm tiếp nhận Excel và phân công Tổ/cán bộ.

## Nguồn tham khảo chính thống

- [IBM Carbon — Data table usage](https://carbondesignsystem.com/components/data-table/usage/): dành phần lớn chiều rộng trang cho bảng; chọn hàng cỡ lớn khi nội dung dự kiến có hai dòng; luôn có trạng thái hover để hỗ trợ dò ngang; zebra nhẹ có thể hỗ trợ quét dòng.
- [Apple HIG — Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables): bảng phù hợp để quét văn bản; tiêu đề cột cần ngắn, mô tả; bảng nhiều cột rộng nên có màu hàng xen kẽ nhẹ.
- [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout): căn chỉnh nhất quán tạo quan hệ thị giác và giúp quét nội dung; bố cục phải thích ứng theo kích thước màn hình.
- [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography): khi chiều rộng hạn chế, xếp thông tin phụ theo chiều dọc và giảm số cột thay vì cắt ngắn nội dung quan trọng.
- [W3C WAI — Table Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/) và [Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/): dùng phần tử bảng HTML gốc cho dữ liệu tĩnh; khai báo tiêu đề cột và quan hệ hàng/cột bằng ngữ nghĩa, không chỉ bằng màu sắc.

## Quyết định áp dụng

1. Sau khi đọc file, bảng trở thành nội dung chính; thông tin nguồn và đối soát thu vào một disclosure một dòng, mặc định đóng.
2. Giữ sáu cột: `STT`, `Mã`, `Nội dung và yêu cầu`, `Tổ theo dõi`, `Phụ trách`, `Điểm`.
3. `Tổ theo dõi` và `Phụ trách` tách thành hai control phụ thuộc: chọn Tổ trước mới mở danh sách cán bộ đúng Tổ; phần nội dung vẫn nhận phần lớn chiều rộng.
4. Bỏ badge “Nội dung cơ bản” lặp ở 22 hàng; thay bằng hai hàng phân nhóm `I` và `II` có tổng mục và tổng điểm.
5. Nội dung chính dùng cỡ 13 px, line-height 20–21 px, padding hàng 12 px; tiêu đề cột cao 42 px và bám trên khi cuộn.
6. Không dùng zebra; hover/focus đổi nền trung tính trên toàn hàng. Hai cột `STT` và `Mã` bám trái khi cuộn ngang để người dùng không mất ngữ cảnh.
7. Trên màn dưới 640 px, vẫn giữ HTML `<table>` nhưng trình bày mỗi hàng thành khối dọc. Nội dung được đọc trọn vẹn và không cần kéo ngang.
8. Thêm `caption`, `scope="col"` và `scope="rowgroup"` để công nghệ hỗ trợ hiểu cấu trúc.
9. Thanh thao tác của bảng gom đúng bốn việc: tìm kiếm, lọc trạng thái, xem tiến độ và xác nhận. Tìm kiếm hỗ trợ mã, nội dung và tiếng Việt không dấu.
10. Lọc không đánh lại STT; số thứ tự luôn là vị trí thật trong workbook. Trạng thái rỗng có hành động xóa bộ lọc tại chỗ.

## Chủ động không thêm

- Không thêm sắp xếp, chỉnh cột hay lựa chọn mật độ cho 27 hạng mục; chúng chưa giải quyết thêm một nhu cầu đã được chứng minh.
- Không mô phỏng ribbon, ô tọa độ hay công thức Excel; người dùng đang kiểm tra danh mục nghiệp vụ, không biên tập workbook.
- Không dùng ARIA grid hoặc tự mô phỏng spreadsheet. Giữ bảng HTML và các `select` native để bàn phím, trình đọc màn hình và validation trình duyệt tiếp tục hoạt động.

## Vòng nghiên cứu 14/08/2026 — truy nguồn kết quả thẩm định

Phạm vi vòng này là chế độ `Kết quả thẩm định` trong chính bảng điểm Admin, không thay đổi bảng nhập liệu nguồn.

### Nguồn bổ sung

- [IBM Carbon — Data table usage](https://carbondesignsystem.com/components/data-table/usage/): thanh công cụ là vị trí của tìm kiếm/lọc; hàng mở rộng dành cho progressive disclosure, không mở tất cả chi tiết mặc định; bảng dữ liệu không nên giả lập nguyên một ứng dụng spreadsheet.
- [SAP Fiori — Responsive table](https://experience.sap.com/fiori-design-web/responsive-table/): giữ mã định danh và thuộc tính chính của dòng; giảm số cột ở vùng hẹp, đưa thông tin phụ vào vùng pop-in; tiêu đề cột phải có nhãn và bám khi cuộn; trạng thái phải có chữ thay vì chỉ màu.
- [GOV.UK — Tag](https://design-system.service.gov.uk/components/tag/): dùng số trạng thái tối thiểu; trạng thái không phải nút; không dùng màu làm tín hiệu duy nhất; nền nhẹ và chữ tối giúp tránh bị hiểu nhầm là hành động.
- [W3C WAI — Tables tutorial](https://www.w3.org/WAI/tutorials/tables/): ô định danh của mỗi dòng phải là row header thật (`th[scope=row]`), không chỉ được làm đậm bằng CSS.
- [Atlassian — Dynamic table](https://atlassian.design/components/dynamic-table): tìm kiếm, lọc, phân trang hoặc sắp xếp là năng lực của bảng động, nhưng chỉ thêm khi giải quyết đúng khối lượng và tác vụ của người dùng.

### Audit và thay đổi đã áp dụng

1. Ở viewport 887 px, bộ lọc kết quả trước đây bị ẩn hoàn toàn bởi breakpoint 1100 px. Điều này làm Admin không thể chuyển nhanh giữa `Đã nhận`, `Có chênh lệch` và `Chưa nhận`. Bộ lọc nay luôn hiện trong chế độ kết quả; trên mobile nó nằm cạnh ô tìm kiếm thay vì chiếm một hàng dashboard mới.
2. Ô tìm kiếm trước đây chỉ tra mã/nội dung. Nó nay tra cả `reviewerName` và `teamLabel`, vì “đồng chí nào đã chấm những dòng nào” là truy vấn nghiệp vụ thật. Các trường `Tổ/Phụ trách` của Excel nguồn không được trộn vào kết quả tìm người chấm.
3. Mã I.01… nay dùng `th scope="row"`. Header cột vẫn dùng `scope="col"` và bảng có caption chỉ-đọc.
4. Giữ sáu cột hiện tại, không thêm cột `Lịch sử` giả. `submittedAt` chỉ là thời điểm nhận snapshot; revision/audit chỉ xuất hiện khi backend có AuditRecord thật.
5. Giữ hàng mở rộng cho bốn hồ sơ đơn vị. Mặt bảng chỉ trả lời dòng nào, điểm trước–sau, ai chấm và khi nào; bằng chứng/lý do nằm ở tầng chi tiết.
