# Chuyển ngữ workbook thành UX nghiệp vụ Thành đoàn Hải Phòng

Ngày phân tích: 12/08/2026  
Phạm vi: Admin · Tiếp nhận và phân bổ hạng mục · Chiến dịch TNTN Hè 2026

## 1. Kết luận thiết kế

**Thứ tự triển khai đã được thu gọn:** bản local hiện chỉ làm `chọn Excel → đọc → danh sách`. Các phần phân bổ, phân công và ban hành dưới đây là kiến trúc đích cho các bước sau, không phải chức năng đã có.

Không sao chép nguyên một bảng Excel lên web. Workbook là bằng chứng của biểu mẫu đã được phân cho khối ĐH/CĐ, không phải toàn bộ điểm bắt đầu của quy trình. Sản phẩm TO-BE tổ chức công việc theo năm câu hỏi tự nhiên:

1. Trung ương đã giao cho Hải Phòng những nội dung nào?
2. Mỗi nội dung áp dụng cho khối đơn vị nào?
3. Tổ chuyên môn nào chịu trách nhiệm hướng dẫn, đối soát và thẩm định?
4. Mỗi nội dung được ghi nhận tối đa bao nhiêu điểm và cần minh chứng gì?
5. Quy tắc nào phải được thống nhất trước khi ban hành?

## 2. Cơ sở ngôn ngữ tổ chức

Các nguồn công khai chính thức của Hải Phòng dùng nhất quán các khái niệm `các cấp bộ Đoàn`, `đơn vị`, `công trình, phần việc`, `phân công`, `hướng dẫn`, `đôn đốc`, `Ban Chỉ đạo` và `Ban Thường vụ`. Chiến dịch được mô tả theo định hướng hướng về cơ sở. Vì vậy UX phải làm rõ nội dung, trách nhiệm và điều kiện ghi nhận theo đơn vị, không lấy hàng/cột làm chủ thể.

Nguồn tham khảo:

- Cổng thông tin Thành đoàn Hải Phòng: https://thanhdoanhaiphong.gov.vn/
- Chuyên mục Hướng dẫn của Thành đoàn: https://thanhdoanhaiphong.gov.vn/huong-dan-fd63.html
- Thông tin ra quân Chiến dịch TNTN Hè 2026: https://mttq.haiphong.gov.vn/Thong-tin-hoat-dong-cac-to-chuc-thanh-vien/HAI-PHONG-RA-QUAN-CHIEN-DICH-THANH-NIEN-TINH-NGUYEN-HE-NAM-2026-186399.html
- Quyết định địa phương viện dẫn hướng dẫn của Thành đoàn: https://cdn.haiphong.gov.vn/gov-hpg/6797/tintuc/2025/8/688-qd-thanh-lap-bcd-hdh-va-chien-dich-tntn_.signed638896422079305244.pdf

## 3. Bảng chuyển ngữ

| Ngôn ngữ workbook | Khái niệm sản phẩm | Cách hiển thị |
| --- | --- | --- |
| Trang tính | Phần của bộ tiêu chí | Nội dung cơ bản, Điểm thưởng, Xếp loại |
| Hàng điều kiện | Tiêu chí thi đua | Tiêu đề hành động, điểm tối đa, hướng dẫn |
| Cách chấm điểm | Cách ghi nhận điểm | Văn bản ngắn ngay trong chi tiết tiêu chí |
| Ô minh chứng | Hồ sơ/minh chứng | Loại minh chứng hoặc nguồn đối soát |
| Tổ, cán bộ phụ trách | Phân công thẩm định | Tổ chuyên môn và đầu mối |
| Đơn vị tự chấm | Đề nghị của đơn vị | Điểm tự chấm kèm minh chứng |
| Điểm được chấm | Kết quả thẩm định | Điểm thẩm định và lý do điều chỉnh |
| Công thức tổng | Quy tắc tính điểm | Luật miền có phiên bản và kiểm thử |
| File Excel | Nguồn nhập/đối soát | Thẻ nguồn trong Danh mục tiếp nhận |
| Dấu tích theo bảng khối | Phạm vi áp dụng | Ma trận hạng mục × khối đơn vị |

## 4. Kiến trúc thông tin Admin

### Danh mục tiếp nhận

Hiển thị nguồn Trung ương, đơn vị tiếp nhận, 22 nội dung cơ bản + 5 nhóm điểm thưởng và tính toàn vẹn của nguồn. Nội dung Trung ương là bất biến; hướng dẫn Hải Phòng nằm ở lớp dữ liệu riêng.

### Phân bổ theo khối

- 27 hạng mục là hàng; 4 khối đã có bằng chứng là cột.
- Checkbox ở giao điểm trả lời “khối này có phải thực hiện mục này không?”.
- Có tìm kiếm, bộ lọc, chọn hàng và thêm/gỡ khối hàng loạt.
- Chi tiết hàng vẫn hiển thị điểm tối đa, cách ghi nhận, minh chứng và tổ theo dõi.
- 27 dấu tích ĐH/CĐ ban đầu là gợi ý từ tên workbook, không phải quyết định đã ban hành.

### Phân công

Năm tổ: Phong trào, Thanh thiếu nhi trường học, Tuyên giáo, Tổ chức – Kiểm tra, Văn phòng. Trách nhiệm tách biệt:

- Đơn vị tham gia nhập điểm tự chấm và minh chứng.
- Tổ chuyên môn nhập điểm thẩm định; bắt buộc nêu lý do khi điều chỉnh.
- Văn phòng/Hội đồng TĐKT duyệt điểm thưởng và kết quả cuối.

### Rà soát & ban hành

Năm quyết định P0:

1. Chốt tài liệu đang nói 4 hay 5 khối.
2. Tách người tự chấm và người thẩm định.
3. Chỉ cộng điểm thưởng đã phê duyệt.
4. Chốt cách áp trần 25 điểm thưởng.
5. Chốt II.1 tính tối đa 3 hay 10 hoạt động.

Ban hành bị khóa cho đến khi năm P0 và tám quy tắc chi tiết được xác nhận.

## 5. Nguyên tắc giao diện

- Một màn hình trả lời một mục đích; độ sâu thông tin tăng dần theo lựa chọn của người dùng.
- Dùng xanh lam cho hành động/chọn hiện tại; xanh lục chỉ cho trạng thái đã hoàn tất; vàng cho nội dung cần quyết định.
- Không dùng màu Excel để suy ra quyền ghi.
- Chỉ dùng hình thái bảng khi quyết định thực sự là ma trận nhiều–nhiều; không hiển thị tọa độ ô hoặc công thức Excel trong luồng nghiệp vụ.
- Không tạo nút giả: thao tác chưa có backend phải bị khóa hoặc ghi rõ chỉ lưu local.
- Mỗi điểm số luôn đi cùng ngữ nghĩa `điểm tối đa`, `tự chấm`, `thẩm định` hoặc `được tính`.

## 6. Tiêu chí nghiệm thu bản local

- Người không biết Excel hiểu ngay hàng là hạng mục và cột là khối nhận việc.
- Thấy đủ 27 hạng mục × 4 khối và có thể tích trực tiếp hoặc thao tác hàng loạt.
- Tìm được một hạng mục theo từ khóa và lọc theo tổ.
- Mở một hàng biết ngay việc cần làm, điểm tối đa, minh chứng và ai thẩm định.
- Xem được phân công của đủ 5 tổ.
- Trả lời đủ 5 quyết định thì lưu được bản rà soát nhưng vẫn chưa thể ban hành vì còn 8 quy tắc.
- Mobile không cuộn ngang toàn trang; bảng phân bổ và phân công cuộn trong khung riêng.
