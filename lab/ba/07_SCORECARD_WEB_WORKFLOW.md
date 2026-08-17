# Luồng web cho bảng điểm — từ oracle Excel đến workspace theo vai trò

Ngày chốt lát cắt: 13/08/2026  
Phạm vi triển khai ngay: Admin Hải Phòng · bảng điểm ĐH/CĐ · local-only.

## 1. Nguyên tắc chuyển đổi

Workbook là oracle về **dữ liệu, header, điểm và liên kết công thức**. Workbook không phải oracle về quyền và trình tự thao tác vì một sheet đang trộn trường của nhiều chủ thể, không có protection/data validation và có công thức điểm thưởng bị đứt.

Web có hai lớp song song:

1. `Đối chiếu Excel`: đủ 12/10 header, 30 + 25 dòng chấm, dùng để xác nhận không mất dữ liệu.
2. `Chế độ công việc`: chỉ hiện thông tin và hành động mà actor hiện tại cần để hoàn thành một quyết định.

Hai lớp dùng chung một state theo `ScorecardLine.id`; thay đổi phân công ở chế độ công việc phải xuất hiện ngay trong bảng đối chiếu.

## 2. Actor và workspace

| Actor | Câu hỏi chính | Trường được ghi | Workspace đích |
| --- | --- | --- | --- |
| Admin/Chủ chiến dịch | Nội dung nào áp dụng, ai theo dõi, bản nào được ban hành? | phạm vi, tổ, phụ trách, thời hạn, version | Bảng tiêu chí · Phạm vi · Phân công · Rà soát |
| Đơn vị cơ sở | Tôi còn thiếu gì để gửi hồ sơ? | tự chấm, minh chứng, báo cáo | Hồ sơ tự chấm theo từng tiêu chí |
| Chuyên viên | Hồ sơ nào và tiêu chí nào tôi phải quyết định? | được chấm, nhận xét/lý do | Hàng chờ và review workbench |
| Chủ chiến dịch/Hội đồng | Có thể công bố/chốt chưa? | quyết định công bố/chốt | Đối soát và snapshot kết quả |

Không dùng một bảng có thể ghi cho cả bốn actor trong production.

## 3. Luồng cấu hình Admin

```text
TIẾP NHẬN
  đọc nguồn → kiểm tra 55 dòng → ghi nhận bất nhất
        ↓
PHẠM VI ÁP DỤNG
  chọn khối → ngoại lệ đơn vị → kiểm tra mẫu số điểm
        ↓
PHÂN CÔNG
  chọn dòng → gán tổ → gán cán bộ thuộc tổ → kiểm tra dòng thiếu
        ↓
RÀ SOÁT
  dữ liệu nguồn + phạm vi 4 khối + phân công + quyết định P0
        ↓
BAN HÀNH
  tạo snapshot bất biến → cấp bảng phù hợp cho 134 đơn vị
```

Lát cắt hiện tại coi bước `Tiếp nhận` đã hoàn tất thủ công từ workbook và triển khai sâu bước `Phân công`. `Phạm vi áp dụng` vẫn là module tiếp theo vì còn blocker 4/5 khối.

## 4. Hợp đồng hành động của màn Phân công

| Hành động | Điều kiện | Kết quả local |
| --- | --- | --- |
| Chọn dòng | dòng đang hiển thị | đưa dòng vào tập thao tác hàng loạt |
| Chọn tất cả trang | có dòng sau tìm/lọc | chọn đúng tập đang hiển thị, không chọn dòng ẩn |
| Chọn tổ | luôn có thể | xóa cán bộ hiện tại nếu cán bộ không thuộc tổ mới |
| Chọn cán bộ | đã chọn tổ | chỉ liệt kê cán bộ thuộc tổ |
| Áp dụng hàng loạt | có dòng + có tổ | cập nhật các dòng đã chọn; cán bộ có thể bổ sung sau |
| Lưu bản nháp | state thay đổi | ghi state vào `sessionStorage`, báo thời điểm lưu |
| Rà soát | luôn có thể | mở checklist; ban hành bị khóa nếu còn dòng thiếu/P0/backend |

`Đã phân công` nghĩa là một dòng có cả `Tổ theo dõi` và `Phụ trách`. Chỉ có tổ hoặc chỉ có cán bộ là `Chưa đủ`.

## 5. Trạng thái sản phẩm

```text
SOURCE_VERIFIED → ASSIGNING → READY_FOR_REVIEW → PUBLISHED
```

- `SOURCE_VERIFIED`: fixture đã đối soát với workbook, chưa phải bản ban hành.
- `ASSIGNING`: được lưu nháp nhiều lần; chưa tạo quyền chấm có hiệu lực.
- `READY_FOR_REVIEW`: đủ phân công nhưng vẫn phải giải quyết blocker P0 và phạm vi.
- `PUBLISHED`: chỉ backend được tạo snapshot bất biến; prototype local không giả lập thành công trạng thái này.

## 6. Luồng giao dịch sau khi ban hành

```text
Đơn vị tự chấm → Gửi hồ sơ → Khóa phiên bản
→ Chuyên viên chấm vòng 1 → Admin công bố
→ Đơn vị giải trình chênh lệch → Chuyên viên chấm vòng 2
→ Chốt snapshot kết quả → Đơn vị xem/tải
```

Quy tắc hiển thị điểm vòng 1: đơn vị không thấy `Được chấm` trước khi công bố. Khi điểm thẩm định thấp hơn tự chấm, lý do là bắt buộc. Minh chứng bổ sung trong giải trình phải là bản ghi mới có thời điểm và người nộp, không ghi đè minh chứng đã khóa.

## 7. Quyết định còn cần khách hàng xác nhận

1. II.1 chứa tối đa 10 slot nhưng mỗi đơn vị chỉ được tính tối đa 3 hoạt động: cap 9 hay cơ chế chọn 3 hoạt động hợp lệ?
2. Ai có quyền duyệt phân công và ai là người ban hành cuối cùng trong 5 tài khoản Admin?
3. Một dòng có một chuyên viên chính hay cho phép người phối hợp/người thay thế?
4. Tiêu chí không áp dụng có bị loại khỏi mẫu số 83 của từng đơn vị hay không?

Quyết định 4 khối/không tạo khối thứ năm đã được chốt tại `D-2026-08-13-01`.
