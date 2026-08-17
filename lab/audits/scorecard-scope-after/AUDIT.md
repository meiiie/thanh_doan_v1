# Audit sau thay đổi — Phân khối hạng mục

Ngày xác nhận: 13/08/2026  
Route: `/admin/scorecard-templates`

## Kết quả

| Bước | Bằng chứng | Kết luận |
| --- | --- | --- |
| 1. Mở thiết lập bảng điểm | [`01-scope-desktop.png`](01-scope-desktop.png) | Cột `Khối áp dụng` hiển thị bốn lựa chọn trực tiếp; nội dung, điểm, tổ và cán bộ vẫn cùng một hàng. |
| 2. Kế thừa nguồn ĐH/CĐ | [`01-scope-desktop.png`](01-scope-desktop.png) | 27 hạng mục có ĐH/CĐ làm giá trị nháp có nguồn; Admin có thể thêm/bỏ ba khối còn lại. |
| 3. Rà soát phân bố | [`02-scope-review.png`](02-scope-review.png) | Hiển thị số hạng mục và số đơn vị của từng khối; không còn blocker giả “4 hay 5 khối”. |
| 4. Mobile | [`03-scope-mobile.png`](03-scope-mobile.png) | Trang không tràn; bảng giữ đầy đủ cột bằng vùng cuộn ngang. Công việc phân khối hàng loạt vẫn ưu tiên desktop. |

## Bất biến đã kiểm tra

- Có đúng 4 khối và tổng 134 đơn vị.
- Applicability lưu theo 27 `ScorecardGroup`, không theo 55 dòng chấm.
- Một hạng mục có thể áp dụng cho nhiều khối.
- Thay đổi phạm vi tham gia cùng bản nháp với phân công và được khôi phục từ `sessionStorage`.
- `Ban hành` tiếp tục bị khóa vì prototype chưa có backend, transaction audit và quyền duyệt.

## Kiểm thử

- 8 unit tests đạt, gồm quy tắc nhiều–nhiều và tổng 4 khối/134 đơn vị.
- E2E đạt desktop, tablet, mobile; 8 route; 0 console error; 0 runtime error.

