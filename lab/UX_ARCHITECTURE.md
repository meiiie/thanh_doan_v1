# Kiến trúc trải nghiệm và thông tin

## 1. Chẩn đoán bản hiện tại

### Giữ lại

- Ngôn ngữ nghiệp vụ tiếng Việt thật, trạng thái chiến dịch và dữ liệu thật.
- Server action/form semantic, nền tảng accessibility và các kịch bản end-to-end.
- Toàn bộ logic vòng chấm, giải trình, applicability, audit và export làm test oracle.

### Không dùng làm design reference

- Một shell và một sidebar nông cho mọi vai trò; điều hướng phản ánh route hơn là công việc.
- Phase rail lớn lặp lại trên mọi trang, chiếm vùng nhìn nhưng không giúp hoàn thành tác vụ.
- Trang quản trị gộp chiến dịch, tài khoản, phân công, reopen, export thành một cuộn dài.
- Màn chấm đặt hàng chờ, bằng chứng, điểm và lịch sử xa nhau; người chấm phải chuyển ngữ cảnh liên tục.
- Bảng tự chấm kéo dài theo chiều dọc, thiếu điều hướng tiêu chí và thiếu bản tóm tắt lỗi trước gửi.
- Card/panel lặp lại đồng dạng; số liệu trang trí lấn át ngoại lệ cần xử lý.
- Responsive mới thay layout, chưa thay task flow.

## 2. North-star UX

Sau khi đăng nhập, mỗi người dùng phải trả lời được trong 5 giây:

1. Tôi đang làm việc trong chiến dịch/giai đoạn nào?
2. Việc quan trọng nhất của tôi bây giờ là gì?
3. Nó đang bị chặn bởi ai hoặc điều kiện nào?
4. Tôi có thể hoàn thành hành động đó ở đâu?

Dashboard là danh sách quyết định/ngoại lệ, không phải bức tường biểu đồ.

## 3. Sidebar theo vai trò

### Superadmin hệ thống

```text
Tổng quan
Bảng Tổng
Phiên bản
Điều hành chấm
Kết quả & đối soát
Tổ & cán bộ

QUẢN TRỊ HỆ THỐNG
  Cơ cấu tổ chức
  Tài khoản & quyền
```

Superadmin có toàn bộ capability điều hành nhưng dùng đúng các command/audit như Admin; không có đường tắt sửa điểm, ghi đè lịch sử hoặc vượt qua bốn mắt.

### Admin chiến dịch / chủ chiến dịch

```text
Tổng quan

ĐIỀU HÀNH
  Hồ sơ đơn vị
  Thẩm định
    Vòng 1
    Giải trình
    Vòng 2
  Kết quả & đối soát

CẤU HÌNH
  Bảng tiêu chí
  Phân công
  Mốc thời gian

QUẢN TRỊ
  Danh bạ & quyền
  Nhật ký
  Xuất dữ liệu
```

Một chiến dịch có thể có nhiều Admin. Mỗi người chỉ nhìn thấy các chiến dịch được cấp grant; quyền ban hành, mở lại hoặc ghi đè là capability riêng, không suy ra từ nhãn “Admin”.

### Người theo dõi Tổ (SubAdmin1)

```text
Tổng quan tổ
Tiến độ cán bộ chấm
Việc chưa chấm
Phạm vi tiêu chí của tổ
Việc tôi chấm (chỉ khi được giao)
Lịch sử của tổ
```

SubAdmin1 đọc toàn bộ tiến độ trong `teamId` nhờ capability `review.team.overview`. Capability này không tự tạo assignment, quyền duyệt, sửa điểm hay chấm thay. Khi `assessorId` của một tiêu chí là chính SubAdmin1, họ xử lý tiêu chí đó theo cùng rule với Reviewer khác.

### Cán bộ chấm (SubAdmin2)

```text
Việc cần làm
Đang thẩm định
Giải trình
Đã hoàn thành
Đơn vị theo dõi
Lịch sử của tôi
```

### Đơn vị

```text
Việc cần làm
Hồ sơ tự chấm
Minh chứng
Giải trình
Kết quả
Lịch sử hồ sơ
```

### Kiểm tra / auditor

```text
Tổng quan kiểm tra
Kết quả & sai lệch
Nhật ký nghiệp vụ
Truy vết hồ sơ
Xuất dữ liệu
```

Mục không có quyền không hiển thị. Tuy vậy server vẫn là nguồn quyết định quyền cuối cùng.

## 4. App shell

- Workspace nghiệp vụ dùng sidebar 304px mở, 88px thu gọn và drawer trên mobile; nhóm và nhãn role rõ ràng.
- Không dùng topbar trong workspace Admin/Reviewer/Unit. Danh tính, vai trò và menu tài khoản nằm ở chân sidebar; menu tự đóng khi đổi route, thu gọn sidebar, bấm ngoài, nhấn Escape hoặc mất focus cửa sổ.
- Main content là mặt phẳng full width; bảng điều hành và workbench ưu tiên diện tích dữ liệu, không bọc trong card trang trí.
- Phase stepper lớn chỉ ở Tổng quan chiến dịch và trang cấu hình thời gian.
- Breadcrumb dùng cho chiều sâu (`Hàng chờ / Đơn vị A / Tiêu chí 3`), không lặp tên màn hình.
- Một primary action ở vùng nhìn; thao tác nguy hiểm dùng confirm có hệ quả và lý do bắt buộc.

## 5. Ba archetype màn hình

### A. Command center — Chủ chiến dịch

Mục tiêu: phát hiện nút thắt và can thiệp đúng chỗ.

```text
Topbar: Chiến dịch 2026 · Vòng 1 · còn 3 ngày
Title: Tổng quan điều hành              [Xuất báo cáo]

Attention queue (ưu tiên):
- 12 hồ sơ chưa gửi, 3 quá hạn
- 8 hồ sơ chờ phân công
- 6 hồ sơ không có hoạt động > 48h
- 2 sai lệch điểm cần đối soát

Progress by workflow (compact, one chart only)
Unit table: đơn vị · trạng thái · tiến độ · chủ sở hữu · blocker · cập nhật
```

Không có nhiều KPI card đồng hạng. Số liệu chỉ xuất hiện nếu dẫn đến hành động.

### B. Review workbench — Chuyên viên

Mục tiêu: chấm một tiêu chí mà không mất ngữ cảnh.

```text
Level 1: danh sách tiêu chí được giao · tiến độ theo lượt đơn vị · trạng thái
Level 2 center: các đơn vị thuộc tiêu chí · tự chấm · minh chứng · trạng thái
Level 2 right 420px: hồ sơ đơn vị · minh chứng/giải trình · nhập điểm · lý do · quyết định
Footer inspector: Trả bổ sung (vòng 1) · Chốt vòng hiện tại
```

Reviewer luôn đi từ tiêu chí đến đơn vị. Mỗi quyết định hiện trần điểm, dữ liệu vòng trước và lý do sai lệch. Bằng chứng mở trong inspector, không làm mất dữ liệu đang nhập. SubAdmin1 chỉ nhìn tiến độ toàn Tổ; quyền chấm vẫn cần assignment cụ thể.

### C. Unit workspace — Đơn vị

Mục tiêu: biết phần nào chưa đủ điều kiện gửi và sửa ngay.

```text
Header: Hồ sơ tự chấm · autosave state · deadline
Left 264px: nhóm tiêu chí + progress + lỗi
Center: một tiêu chí tại một thời điểm
Right 320px: tóm tắt điểm, minh chứng, checklist điều kiện
Sticky footer: Trước · Lưu · Tiếp theo
Global submit xuất hiện khi checklist đủ điều kiện
```

Không render toàn bộ bảng điểm thành một trang dài. Có chế độ “xem toàn bộ” chỉ để rà soát/in.

## 6. Task model theo trạng thái

| Trạng thái nghiệp vụ | Đơn vị | Chuyên viên | Chủ chiến dịch |
|---|---|---|---|
| Chuẩn bị | xem hướng dẫn | xem phân công | cấu hình, nhập dữ liệu |
| Tự chấm mở | nhập hồ sơ, gửi | theo dõi | xử lý chậm/khóa/mở lại |
| Vòng 1 | chỉ xem | chấm & hoàn thành | phân công, theo dõi SLA |
| Khóa vòng 1, mở giải trình | chỉ thấy dòng bị giảm và lý do cần đối chiếu | xem quyết định trong phạm vi | mở giải trình, đối soát; không công khai bảng điểm vòng 1 |
| Giải trình | gửi giải trình | tiếp nhận/đề nghị bổ sung | theo dõi quá hạn |
| Vòng 2 | xem | quyết định lại | giải quyết xung đột |
| Chốt | xem/tải kết quả | xem | chốt, snapshot, export |

Action không hợp lệ theo trạng thái phải biến mất hoặc bị vô hiệu kèm lý do cụ thể, không chỉ báo “không thể thao tác”.

## 7. Luồng quan trọng

### Đơn vị gửi hồ sơ

`Việc cần làm → Hồ sơ tự chấm → sửa tiêu chí thiếu → rà soát → xác nhận hệ quả → gửi → biên nhận`

Biên nhận gồm thời gian, người gửi, version, tổng điểm và liên kết tải bản chụp.

### Chuyên viên hoàn thành vòng chấm

`Hàng chờ → nhận hồ sơ → tiêu chí → xem bằng chứng → nhập quyết định → tiêu chí tiếp theo → rà soát sai lệch → hoàn thành vòng`

### Chủ chiến dịch mở lại

`Hồ sơ đơn vị → chi tiết → Mở lại → chọn phạm vi + deadline + lý do → xác nhận → audit + thông báo`

## 8. Trạng thái UI bắt buộc

Mỗi màn có thiết kế cho: loading/skeleton, empty, empty-after-filter, partial data, validation error, permission denied, stale version/conflict, network retry, deadline passed, read-only/finalized và success receipt.

## 9. Accessibility và nội dung

- Mục tiêu WCAG 2.2 AA; vùng bấm tối thiểu 24×24 CSS px, control chính 40–44px.
- Focus ring 2px tương phản; sticky header/footer không che focus.
- Form error gắn với trường, có error summary và di chuyển focus hợp lý.
- Trạng thái luôn có text/icon, không chỉ màu.
- Viết động từ cụ thể: “Gửi hồ sơ”, “Hoàn thành vòng 1”, “Mở lại đến 17:00 15/08”; tránh “Xử lý”, “OK”, “Cập nhật”.
- Với hành động điểm số quan trọng, luôn có bước rà soát và receipt có thể truy vết.

Nguồn UX đối chiếu: https://design-system.service.gov.uk/patterns/ và https://www.w3.org/TR/WCAG22/
