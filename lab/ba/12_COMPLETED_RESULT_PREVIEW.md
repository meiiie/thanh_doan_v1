# BA — Kịch bản dữ liệu hoàn tất và kết quả tổng hợp

Ngày dựng prototype: 14/08/2026  
Phạm vi: dữ liệu giả định phục vụ kiểm chứng UX; không phải kết quả thật của đơn vị.

## 1. Mục tiêu

Cho phép nhìn xuyên suốt trạng thái khi toàn bộ 16 đơn vị khối Đại học/Cao đẳng đã nhập dữ liệu, nộp minh chứng và được Tổ thẩm định. Admin phải trả lời được ba câu hỏi ngay trên cùng một bảng:

1. đơn vị nào đã đủ dữ liệu để đối soát;
2. tổng cuối được hình thành từ đâu;
3. chênh lệch với tự chấm nằm ở bao nhiêu dòng và có thể truy ngược về hạng mục nào.

## 2. Công thức giữ nguyên từ workbook đã phân tích

```text
Điểm thưởng áp dụng = min(Điểm thưởng thô, 25)
Tổng được chấm = Điểm cơ bản được chấm + Điểm thưởng áp dụng
Tỷ lệ = Tổng được chấm ÷ 83
```

Xếp loại dùng đúng các ngưỡng hiện có: từ 90% `Có khả năng đạt XS`, từ 70% `Tiên tiến`, từ 50% `Hoàn thành`, còn lại `Không hoàn thành`. Vì mẫu cộng điểm thưởng nhưng vẫn chia cho 83, tỷ lệ có thể vượt 100%; UI không tự sửa công thức nguồn.

## 3. Bộ dữ liệu giả định

- 16 hồ sơ đơn vị;
- 27 hạng mục, gồm 55 dòng chấm;
- 55 gói thẩm định, mỗi gói chứa 16 kết quả đơn vị;
- tổng cộng 880 `ReviewResultLine`;
- mọi dòng có điểm tự chấm, điểm được chấm, trạng thái kiểm tra minh chứng và người/Tổ phụ trách từ workbook;
- phần trừ điểm được tập trung vào một số dòng cụ thể, không rải sai lệch cơ học lên mọi dòng.

Tên đơn vị lấy từ executable specification hiện có. Điểm, link minh chứng và thời điểm là dữ liệu mô phỏng, luôn phải ghi rõ `Kịch bản hoàn tất · dữ liệu giả định`.

## 4. Cách biểu diễn trong Admin

`/admin/scorecard-templates` có thêm chế độ `Kết quả cuối` nhưng vẫn giữ bảng điểm làm trung tâm:

| Cột | Ý nghĩa |
| --- | --- |
| Thứ tự* | Sắp giảm dần theo tổng được chấm, chỉ dùng đối soát |
| Đơn vị | Tên, mã và trạng thái thẩm định |
| Hồ sơ | Số dòng chấm/minh chứng đã đủ |
| Tự chấm | Tổng tự chấm sau trần thưởng |
| Cơ bản | Điểm cơ bản được chấm, tối đa 83 |
| Điểm thưởng | Điểm thô và điểm sau khi áp trần 25 |
| Tổng | Tổng được chấm và chênh lệch với tự chấm |
| Tỷ lệ | Tổng chia 83 |
| Xếp loại | Kết quả theo ngưỡng workbook |

Mở một dòng hiển thị công thức, mức đầy đủ, số dòng bị điều chỉnh và nguồn snapshot. Nút `Đối chiếu 55 dòng chấm` nạp chính 880 kết quả này vào chế độ `Kết quả thẩm định` để Admin truy ngược từ tổng đơn vị về từng hạng mục.

## 5. Không đồng nhất “kết quả cuối” với “bảng xếp hạng công bố”

Workbook chưa quy định:

- cách xử lý đồng hạng;
- điều kiện loại trừ dù tổng điểm cao;
- ai có quyền duyệt/chốt;
- cơ chế bốn mắt;
- thời điểm khóa khi còn giải trình;
- mẫu biên bản và phạm vi công bố.

Vì vậy prototype chỉ dùng **thứ tự đối soát**. Nút công bố/chốt thật không được mở trước khi các quy tắc trên được xác nhận và backend tạo immutable snapshot cùng AuditRecord trong một transaction.

## 6. Acceptance

- Chế độ `Kết quả cuối` hiển thị đúng 16 đơn vị và đủ ba xếp loại có trong fixture.
- Tổng của từng đơn vị phải tái tạo được từ 55 gói chi tiết; không dùng số tổng hard-code không truy vết.
- Mỗi điểm sinh ra nằm trong maximum của dòng nguồn.
- Mở dòng đầu đọc được `80 + 25 = 105` và `105 ÷ 83 = 126,5%`.
- Bộ lọc xếp loại và tìm đơn vị hoạt động trên desktop/mobile.
- Chuyển sang đối chiếu chi tiết hiển thị 55/55 dòng và 880 kết quả.
- Trang không tạo horizontal overflow ở document; bảng tự quản lý cuộn ngang trên viewport hẹp.
