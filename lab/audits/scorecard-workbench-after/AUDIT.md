# Audit sau thay đổi — workspace Phân công của Admin

Ngày xác nhận: 13/08/2026  
Route: `/admin/scorecard-templates`

## Các bước đã kiểm tra

| Bước | Bằng chứng | Sức khỏe | Kết quả |
| --- | --- | --- | --- |
| 1. Mở bảng điểm | [`01-assignment-desktop.png`](01-assignment-desktop.png) | Tốt | Mặc định vào đúng việc của Admin: phân công 55 dòng; không còn trộn ô của đơn vị và tổ thẩm định. |
| 2. Chọn nhiều dòng và gán | E2E desktop | Tốt | Chọn dòng, chọn tổ, danh sách cán bộ phụ thuộc tổ, áp dụng hàng loạt và trạng thái `Đã phân công` hoạt động. |
| 3. Lưu và rà soát | E2E desktop | Tốt có chủ ý | Bản nháp được lưu trong phiên; drawer nêu số dòng thiếu và khóa `Ban hành` vì còn blocker nghiệp vụ/backend. |
| 4. Đối chiếu Excel | [`02-excel-oracle-desktop.png`](02-excel-oracle-desktop.png) | Tốt | Vẫn giữ đủ 12/10 header, 30 + 25 dòng, công thức và dữ liệu nhập; dùng chung state với chế độ Phân công. |
| 5. Mobile | [`03-assignment-mobile.png`](03-assignment-mobile.png) | Chấp nhận được | Trang không tràn viewport; bảng giữ đủ cột bằng vùng cuộn ngang. Mobile phù hợp kiểm tra/điều chỉnh nhẹ, không phải thiết bị tối ưu cho phân công hàng loạt. |

## Đánh giá theo mục tiêu BA

- `Tiếp nhận`: đã biểu diễn là trạng thái hoàn tất sau khi đối soát thủ công workbook.
- `Phân công`: đã có vertical slice chạy được gồm chọn dòng, gán tổ/cán bộ, lọc trạng thái, tiến độ và lưu nháp.
- `Rà soát`: đã có checklist trước ban hành; các quyết định P0 hiện rõ thay vì bị che trong tài liệu.
- `Ban hành`: cố ý bị khóa. Prototype local không giả lập snapshot/audit/ủy quyền production.
- `Đối chiếu Excel`: là oracle có thể mở bất cứ lúc nào, không còn là màn làm việc mặc định.

## Vòng kiểm thử

- `npm run check`: đạt; 7 unit tests, format và production build.
- `npm run test:e2e`: đạt trên desktop 1512×982, tablet 1024×768 và mobile 390×844.
- 8 route Admin đạt semantic baseline; 0 console error, 0 runtime error.
- Local server trả HTTP 200 tại port 4317.

## Nợ sản phẩm còn lại

1. Chốt 4 hay 5 khối bảng điểm.
2. Chốt giới hạn II.1 (3 hay 10 hoạt động; trần điểm tương ứng).
3. Chốt người duyệt phân công/người ban hành trong nhóm Admin.
4. Chốt một hay nhiều chuyên viên trên một dòng.
5. Chốt quy tắc mẫu số 83 khi tiêu chí không áp dụng cho một đơn vị.
6. Thay danh mục cán bộ mô phỏng bằng cơ cấu tổ chức thực khi backend được xây.

