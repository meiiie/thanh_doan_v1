# Completion audit — Admin local · Bước 1 nhập Excel

Ngày kiểm toán: 12/08/2026  
Phạm vi: bản local trên cổng `4317`, riêng vertical slice `chọn Excel → đọc → danh sách`. Không bao gồm phân bổ theo khối, backend, deploy, tự chấm hoặc thẩm định.

## Ma trận yêu cầu – bằng chứng

| Yêu cầu | Bằng chứng hiện tại | Kết luận |
| --- | --- | --- |
| Chạy local, không chiếm cổng 4200 | `scripts/dev.ps1` chạy `127.0.0.1:4317` và có guard cổng | Đạt |
| Chọn file Excel thật | File input chỉ nhận `.xlsx`; parser chạy trong trình duyệt, không gửi máy chủ | Đạt |
| Không âm thầm nuốt lỗi | Sai phần mở rộng, thiếu sheet hoặc thiếu hạng mục trả lỗi rõ | Đạt |
| Đúng dialect hiện tại | Bắt buộc có `Đại học, Cao đẳng` và `Điểm thưởng` | Đạt |
| Đúng danh sách nguồn | 22 nội dung cơ bản + 5 nhóm điểm thưởng = 27 hàng | Đạt |
| Đúng tổng điểm | Gộp các dòng tiếp diễn của mục 21–22 để ra 83 điểm; điểm thưởng thô 69 | Đạt |
| Nhận diện lỗi nguồn | Cảnh báo tiêu đề trong workbook 2026 vẫn ghi năm 2025 | Đạt |
| Giao diện đúng mức | Chỉ có vùng nhập, trạng thái đọc/lỗi/thành công và bảng kết quả; không có phân bổ/ban hành giả | Đạt |
| Responsive và truy cập | Desktop/tablet/mobile; bảng cuộn trong khung, trang không tràn; control có tên truy cập | Đạt |
| Quality gate xanh | Prettier; 5/5 unit test; production build; 8/8 route; 0 console/page error; 6 ảnh regression | Đạt |
| Runtime hiện tại | `http://127.0.0.1:4317/admin/scorecard-templates` trả HTTP 200 | Đạt |

## Biên hoàn thành

Bước 1 đã hoàn thành để khách hàng kiểm tra danh sách đọc từ workbook. Những việc sau cố ý chưa làm:

- lưu bản import vào database và tạo receipt/audit bất biến;
- diff hai lần import hoặc hỗ trợ phiên bản nguồn;
- ma trận phân bổ hạng mục theo khối/đơn vị;
- giao tổ theo dõi, rà soát quy tắc và ban hành snapshot;
- hỗ trợ workbook của các khối khác;
- deploy hoặc migration dữ liệu production.

## Gate bước 2

Khách hàng xác nhận ba điểm: đủ 27 hàng, tổng 83/69 đúng ý nghĩa, và cách gộp dòng của mục 21–22. Sau đó mới xây ma trận `hạng mục × khối` từ tài liệu `lab/ba/05_CENTRAL_TO_LOCAL_ALLOCATION.md`.

## Lệnh tái kiểm chứng

```powershell
.\scripts\dev.ps1
# Terminal khác tại root
.\scripts\check.ps1 -Browser
```
