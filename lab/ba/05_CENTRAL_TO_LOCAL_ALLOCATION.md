# Luồng Trung ương → Hải Phòng → khối đơn vị

Ngày xác nhận nghiệp vụ: 12/08/2026  
Trạng thái: **đã được xác nhận để triển khai prototype local ngày 13/08/2026**. Bốn khối là phạm vi vận hành; việc phân khối được thực hiện trên web theo từng hạng mục.

## 1. Hiệu chỉnh giả định trước đây

Workbook ĐH/CĐ không phải toàn bộ điểm bắt đầu của quy trình. Nó là một biểu mẫu đã được định hướng cho **một khối** sau bước phân bổ. Luồng đúng là:

1. Trung ương chuyển danh mục hạng mục cần thực hiện.
2. Thành đoàn Hải Phòng tiếp nhận và giữ bất biến nguồn.
3. Hải Phòng quyết định từng hạng mục áp dụng cho khối nào.
4. Hải Phòng giao tổ chuyên môn hướng dẫn và thẩm định.
5. Sau khi chốt quy tắc, hệ thống ban hành snapshot phân bổ cho các đơn vị.

Sau khi danh sách nhập được xác nhận, màn hình của bước 2 biểu diễn **ma trận applicability** trong một cột gọn `Khối áp dụng`. Một hàng là một hạng mục tiếp nhận; trong ô phạm vi có bốn dấu tích tương ứng bốn khối. Mỗi dấu tích vẫn là một giao điểm của ma trận và là quyết định “khối này phải thực hiện hạng mục này”, nhưng không làm bảng rộng thêm bốn cột.

## 2. Phạm vi khối có bằng chứng

| Mã miền | Khối đơn vị | Số đơn vị | Trạng thái bằng chứng |
| --- | --- | ---: | --- |
| `COMMUNE` | Xã, phường, đặc khu | 114 | Có trong tài liệu dự án |
| `UNIVERSITY` | Đại học, cao đẳng | 16 | Có workbook mẫu riêng |
| `CIVIL_SERVICE` | Khối công chức | 2 | Có trong tài liệu dự án |
| `ARMED_FORCES` | Khối lực lượng vũ trang | 2 | Có trong tài liệu dự án |

Tổng đã xác nhận cho prototype: **4 khối, 134 đơn vị**. Tài liệu đồng thời nói có 5 loại bảng điểm nhưng không nêu tên khối thứ năm. Theo quyết định `D-2026-08-13-01`, không tạo khối giả; câu “5 loại” được lưu như sai lệch của tài liệu nguồn.

## 3. Tách các quyết định đang bị Excel trộn lẫn

| Quyết định | Câu hỏi nghiệp vụ | Chủ thể | Không được trộn với |
| --- | --- | --- | --- |
| Tiếp nhận | Trung ương đã giao nội dung gì? | Thành đoàn/Văn phòng | Quyết định áp dụng của địa phương |
| Phạm vi áp dụng | Khối nào phải thực hiện mục này? | Chủ chiến dịch Hải Phòng | Người theo dõi/chấm |
| Phân công | Tổ nào hướng dẫn và thẩm định? | Chủ chiến dịch/Trưởng tổ | Khối phải thực hiện |
| Hướng dẫn địa phương | Minh chứng, hạn hoặc cách ghi nhận tại Hải Phòng là gì? | Tổ chuyên môn | Nội dung gốc của Trung ương |
| Ban hành | Phiên bản nào có hiệu lực cho đơn vị nào? | Người có thẩm quyền | Bản nháp đang sửa |

Một hạng mục có thể áp dụng cho nhiều khối; một khối có nhiều hạng mục. `Applicability` vì thế là quan hệ nhiều–nhiều, không phải một trường `unitType` trên tiêu chí.

## 4. Mô hình dữ liệu nghiệp vụ

```text
CentralDirectiveItem
  id, sourceDocumentId, sourceCode, sourceText, sourceVersion
  └─ immutable sau khi tiếp nhận

LocalCampaignItem
  id, campaignId, centralItemId, displayOrder, localGuidance

Applicability
  campaignItemId, unitBlockId, applies, reason, decidedBy, decidedAt
  └─ khóa duy nhất (campaignItemId, unitBlockId)

TeamAssignment
  campaignItemId, professionalTeamId, responsibility, effectiveFrom

PublishedAllocationSnapshot
  id, campaignId, version, publishedAt, publishedBy, checksum
  └─ bất biến; đơn vị nhận hạng mục từ snapshot này
```

Không sửa `CentralDirectiveItem` để “địa phương hóa”. Phần bổ sung của Hải Phòng nằm ở `LocalCampaignItem`, `Applicability` và `TeamAssignment`, nhờ vậy có thể truy vết đúng nguồn.

## 5. Hành vi của bảng phân bổ

- Cố định cột chọn, mã và nội dung để người dùng không mất ngữ cảnh khi cuộn ngang.
- Mỗi ô checkbox có tên truy cập đầy đủ, ví dụ `01 áp dụng cho Đại học, cao đẳng`.
- Cho phép chọn nhiều hàng rồi thêm/gỡ một khối; không bắt admin tích từng ô khi danh mục dài.
- Tìm theo mã/nội dung; lọc theo phần, tổ và trạng thái chưa phân/nhiều khối.
- Hiển thị tổng hạng mục của từng khối và số mục chưa có khối.
- Mở chi tiết ngay trong hàng để xem cách ghi nhận, minh chứng và tổ theo dõi.
- Dấu tích ĐH/CĐ từ workbook hiện tại chỉ là **gợi ý có nguồn**, không phải quyết định đã ban hành.
- Bỏ tích không xóa hạng mục gốc; bản thật phải lưu lý do loại trừ khi đã từng được ban hành.

## 6. Trạng thái và bất biến

```text
RECEIVED → ALLOCATING → UNDER_REVIEW → PUBLISHED → SUPERSEDED
```

- Không ban hành nếu còn hạng mục bắt buộc chưa có khối.
- Không ban hành khi số khối 4/5 chưa được xác nhận.
- Không sửa snapshot đã ban hành; thay đổi tạo phiên bản nháp kế tiếp.
- Mỗi đơn vị chỉ nhận hạng mục nếu khối của đơn vị có `applies = true` trong snapshot.
- Quyền thẩm định được tính từ cả assignment và phạm vi đơn vị; biết ID không đủ quyền đọc/ghi.
- Import workbook mới không được ghi đè quyết định địa phương hiện có nếu chưa có diff và người phê duyệt.

## 7. Acceptance examples dự kiến cho bước 2

1. Mở trang thấy 27 hạng mục và một cột phạm vi chứa 4 lựa chọn khối, tổng cộng 108 giao điểm applicability. Các dòng chấm con dùng chung quyết định của hạng mục cha.
2. Vì tệp nguồn là mẫu ĐH/CĐ, 27 dấu tích ĐH/CĐ được hiển thị như gợi ý; các khối khác chưa tích.
3. Tích `01 × Xã/phường` làm số mục của khối này tăng từ 0 lên 1 và bật nút lưu.
4. Chọn hàng `02`, `03`, thêm khối LLVT thì cả hai giao điểm tương ứng được tích.
5. Tìm `Bình dân học vụ số` chỉ còn một hàng; lọc `Tổ Tuyên giáo` còn năm hàng.
6. Chuyển tab không làm mất bản phân bổ đang sửa trong phiên local.
7. Rà soát có năm blocker, trong đó blocker đầu tiên là xác nhận 4 hay 5 khối.
8. Mobile không làm tràn toàn trang; bảng cuộn trong khung riêng và giữ cột ngữ cảnh.

## 8. Câu hỏi discovery tiếp theo

1. Danh mục Trung ương đến qua văn bản, workbook chung hay API; cơ quan nào ký và mã phiên bản là gì?
2. Trung ương có chỉ định sẵn khối áp dụng hay Hải Phòng được toàn quyền quyết định?
3. Một mục không áp dụng có bắt buộc ghi lý do và phê duyệt hay không?
4. Có ngoại lệ đến cấp đơn vị, hay chỉ quyết định ở cấp khối?
5. Khi Trung ương sửa một mục đã tiếp nhận, Hải Phòng cần merge, thay thế hay tạo đợt mới?
6. “Loại bảng thứ năm” là khối nào hay là lỗi mô tả?
