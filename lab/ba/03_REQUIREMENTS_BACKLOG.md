# BA Discovery Backlog — Workbook-compatible scoring

Trạng thái: backlog khám phá; chưa phải phạm vi đã cam kết.

## 1. Outcome cần đạt

Một đơn vị có thể hoàn thành công việc quen thuộc như trên Excel, nhưng hệ thống biết rõ:

- họ đang dùng phiên bản bảng điểm nào;
- ô/trường nào họ được sửa;
- còn thiếu điều kiện hoặc minh chứng nào;
- dữ liệu đã nộp hay còn là nháp;
- ai đã chấm, chấm vòng nào và vì sao thay đổi;
- file xuất ra được tạo từ snapshot nào.

## 2. Epic backlog

### BA-E01 — Template Registry và import

**Story:** Là Chủ chiến dịch, tôi tải workbook đã đăng ký để tạo một phiên bản bảng điểm nháp mà không phải gõ lại hàng chục tiêu chí.

Acceptance examples:

- nhận diện hai sheet mẫu và semantic range `A1:L40`, `A1:J30`;
- không import các ô chỉ có style đến hàng 966/984;
- bung shared formula trước khi phân tích;
- cảnh báo năm tiêu đề 2025 khác chiến dịch 2026;
- cảnh báo vùng vàng sheet chính trỏ vào `Được chấm`;
- cảnh báo II.1 “không quá 3” nhưng có 10 dòng;
- người dùng xem mapping diff trước khi xác nhận;
- import lặp cùng checksum là idempotent.

### BA-E02 — Scorecard authoring và version

**Story:** Là Chủ chiến dịch, tôi xem và sửa cây tiêu chí nháp bằng ngôn ngữ nghiệp vụ, rồi publish một version bất biến.

Acceptance examples:

- criterion có code, parent, order, type, max score, team và assignee;
- rule có cấu trúc nhưng vẫn giữ nguyên source text để đối soát;
- tổng max của node cha được kiểm tra với con;
- thay đổi version đã publish tạo version mới, không ghi đè;
- diagnostics phải về 0 blocker trước publish.

### BA-E03 — Hồ sơ đơn vị: Grid mode

**Story:** Là Đơn vị, tôi nhập tự chấm, minh chứng và báo cáo trong một bảng quen thuộc để hoàn thành nhanh trên desktop.

Acceptance examples:

- chỉ `self score`, evidence và narrative của đơn vị có thể edit;
- sticky context vẫn cho biết criterion khi cuộn ngang/dọc;
- keyboard navigation không rơi vào field read-only;
- paste nhiều dòng được validate trước khi commit;
- điểm ngoài rule/max bị chặn tại UI và server;
- tổng dự kiến cập nhật ngay nhưng có nhãn “chưa nộp”.

### BA-E04 — Hồ sơ đơn vị: Task mode

**Story:** Là Đơn vị, tôi xem danh sách tiêu chí chưa hoàn tất và xử lý từng việc mà không phải hiểu toàn bộ bảng.

Acceptance examples:

- lọc `chưa tự chấm`, `thiếu minh chứng`, `cần báo cáo`, `đã đủ`;
- rule và ví dụ tính điểm nhìn thấy trước field nhập;
- mobile không yêu cầu cuộn bảng ngang;
- cùng một edit phản chiếu ngay sang Grid mode.

### BA-E05 — Evidence

**Story:** Là Đơn vị, tôi gắn một hoặc nhiều minh chứng đúng kiểu mà không nhét tất cả vào một ô text.

Acceptance examples:

- hỗ trợ URL, file, văn bản xác nhận, kiểm tra từ hệ thống ngoài và “không yêu cầu minh chứng”;
- evidence có title, source, submitted time, submitter và health status;
- criterion có thể yêu cầu số lượng tối thiểu hoặc từng evidence cho mỗi activity con;
- link chết/mất quyền được đánh dấu nhưng không xóa lịch sử;
- secret/token truy cập không xuất hiện trong export hoặc audit.

### BA-E06 — Reviewer workbench

**Story:** Là Chuyên viên, tôi chỉ thấy tiêu chí và đơn vị được giao, so sánh tự chấm–minh chứng–được chấm trong một ngữ cảnh.

Acceptance examples:

- work queue lấy assignment từ team/assignee;
- awarded score không vượt rule trừ khi policy cho phép;
- điểm thấp hơn tự chấm bắt buộc lý do;
- quyết định lưu actor, time, round và source version;
- đơn vị chưa thấy quyết định trước khi release.

### BA-E07 — Giải trình và vòng chấm

**Story:** Là Đơn vị, tôi giải trình đúng criterion có chênh lệch; là Chuyên viên, tôi tạo quyết định vòng mới mà không ghi đè vòng trước.

Acceptance examples:

- explanation gắn với decision cụ thể;
- bổ sung evidence được version;
- round 2 tạo `ReviewDecision` mới;
- UI so sánh self → round 1 → explanation → round 2;
- finalize tạo snapshot bất biến.

### BA-E08 — Scoring engine

**Story:** Là Hội đồng, tôi nhận tổng điểm có thể giải thích và tái tính từ dữ liệu gốc.

Acceptance examples:

- hỗ trợ boolean, tier, proportional, additive, periodic và capped aggregate;
- `raw bonus`, `applied bonus`, `core`, `total`, `rate`, `classification` hiển thị riêng;
- cap áp đúng theo golden case;
- một công thức duy nhất phục vụ UI, API và export;
- mỗi kết quả cho biết inputs/rule version đã dùng.

### BA-E09 — Excel export và reconciliation

**Story:** Là Ban tổ chức, tôi xuất workbook quen thuộc để lưu trữ và đối soát mà không mất provenance.

Acceptance examples:

- export đúng sheet, order, labels và semantic cells của dialect;
- version, snapshot ID, exported time và checksum được ghi rõ;
- hệ thống tái nhập bản export ở chế độ kiểm tra và đối soát được totals;
- chênh lệch giữa domain và workbook làm export thất bại an toàn;
- export không mở lại hồ sơ đã finalize.

## 3. P0 — Câu hỏi phải chốt trước scoring vertical slice

1. Trên sheet chính, đơn vị phải nhập `G + K` hay thực sự là `H + K` như màu vàng hiện tại?
2. `H35` có phải bằng `SUM(H36:H40)` và có áp `MIN(25, …)` không?
3. Cap 25 áp cho tự chấm, được chấm, cả hai hay chỉ kết quả cuối?
4. II.1 tối đa 3 hoạt động/9 điểm hay 10 hoạt động/30 điểm?
5. `H3/F4` có cố ý dùng điểm cơ bản 83 làm mẫu số và điểm thưởng có đi vào `H3` không?
6. “Có khả năng đạt XS” là dự báo, điều kiện cần hay xếp loại chính thức?
7. Vòng 1/vòng 2 hiện dùng cột/file nào; có ghi đè `Được chấm` không?
8. Người chấm có thể cho cao hơn tự chấm; trường hợp đó có bắt buộc lý do?
9. Bước điểm là 0.5 chung hay cấu hình theo criterion?
10. Import chỉ nhận các template đã đăng ký hay khách hàng kỳ vọng mọi file Excel cùng kiểu đều chạy?
11. Sau import, Excel hay hệ thống web là nguồn sự thật? Có cho nhập ngược file đã sửa vào hồ sơ đang chạy không?
12. Export cần giống pixel để in/ký, hay chỉ cần đúng dữ liệu và cấu trúc?

## 4. Golden cases cần khách hàng ký

| Case | Core | Bonus raw | Bonus applied | Kỳ vọng cần chốt |
|---|---:|---:|---:|---|
| G-01 | 83 | 0 | 0 | rate và classification khi đạt toàn bộ core |
| G-02 | 70 | 10 | 10 | bonus có đi vào rate không |
| G-03 | 70 | 35 | 25 | cap 25 áp ở điểm nào |
| G-04 | 0 | 30 từ II.1 | ? | II.1 giới hạn 9 hay 30 |
| G-05 | 50 | 0 | 0 | ngưỡng 50/70/90 ở biên |
| G-06 | 60 tự chấm | 55 được chấm | — | lý do trừ và round flow |
| G-07 | 50 tự chấm | 55 được chấm | — | reviewer được chấm cao hơn hay không |
| G-08 | có criterion N/A | 0 | 0 | denominator có giảm hay không |

## 5. Definition of Ready cho vertical slice đầu tiên

- P0 câu 1–8 có biên bản quyết định;
- có một golden workbook với expected values;
- mapping dialect ĐHCĐ được version hóa;
- wireflow Grid/Task của Đơn vị và Reviewer được duyệt;
- API contract cho criterion response, evidence và review decision được chốt;
- authorization matrix có test cases;
- export target được xác định là data-fidelity hay print-fidelity;
- không còn blocker trong import diagnostics của workbook mẫu.

## 6. Ngoài phạm vi MVP

- spreadsheet engine tổng quát;
- VBA/macro;
- collaborative cell editing thời gian thực kiểu Google Sheets;
- AI tự quyết định điểm hoặc tự công nhận minh chứng;
- nhập ngược tùy ý vào hồ sơ đã publish/finalize;
- custom formula do end-user viết trực tiếp.
