# BA Lab — Workbook to Product

Trạng thái: **đang khám phá, local-only, chưa phải yêu cầu khách hàng đã ký**.

## Mục tiêu

BA Lab coi file Excel khách hàng đang dùng là một hệ thống AS-IS hoàn chỉnh: vừa chứa dữ liệu, luật tính điểm, giao diện nhập, hướng dẫn thao tác và bản bàn giao. Mục tiêu không phải phủ nhận Excel mà là bóc tách những trách nhiệm đang bị trộn trong một workbook để quyết định phần nào cần giữ nguyên trải nghiệm và phần nào phải trở thành workflow có kiểm soát.

## Nguyên tắc nguồn sự thật

1. Workbook chứng minh cách công việc đang được thực hiện.
2. Công thức và màu sắc trong workbook không tự động trở thành quy tắc TO-BE nếu chúng mâu thuẫn với nhãn hoặc hướng dẫn.
3. Quyết định P0 phải được khách hàng xác nhận bằng ví dụ số cụ thể.
4. Sau khi công bố, một phiên bản bảng điểm là bất biến; import mới tạo phiên bản nháp mới.
5. Excel phải round-trip được, nhưng database nghiệp vụ mới là nguồn sự thật khi chiến dịch đã vận hành trên web.

## Tài liệu

- `01_WORKBOOK_AS_IS.md`: bản đồ workbook, công thức, vai trò và điểm kiểm soát hiện tại.
- `02_SOLUTION_DECISION.md`: so sánh web-native, Excel-like và hybrid; quyết định kiến trúc sản phẩm.
- `03_REQUIREMENTS_BACKLOG.md`: epic, user story, acceptance example và câu hỏi discovery.
- `04_UX_TRANSLATION_HAI_PHONG.md`: từ điển chuyển ngữ Excel → nghiệp vụ Thành đoàn và kiến trúc thông tin Admin.
- `05_CENTRAL_TO_LOCAL_ALLOCATION.md`: luồng Trung ương → Hải Phòng, ma trận applicability và acceptance examples.
- `06_SCORECARD_TEMPLATES_REANALYSIS.md`: tái đối soát Excel + PDF, chỉ ra route hiện tại đang trộn bước và đặc tả lát cắt Tiếp nhận → Kiểm tra.
- `07_SCORECARD_WEB_WORKFLOW.md`: cách chuyển đầy đủ header, công thức và vai trò workbook thành workspace web.
- `08_UNIT_BLOCK_WORKSPACE.md`: mô hình một phân hệ Đơn vị, phạm vi theo tổ chức/khối và vertical slice tự chấm.
- `09_REVIEWER_SUBADMIN_WORKFLOW.md`: vai trò Tổ/Phụ trách, quyền thẩm định, trạng thái và vertical slice vòng 1.

- `10_REVIEW_RESULTS_HANDOFF.md`: gói kết quả hạng mục, điều kiện gửi và bảng Admin tiếp nhận.

## Gate rời BA Lab

- xác nhận chính xác ai được nhập từng cột;
- chốt công thức core/bonus/cap/xếp loại bằng golden cases;
- chốt cách biểu diễn vòng 1, giải trình và vòng 2;
- import mẫu thành công với diagnostics không mơ hồ;
- export tái tạo được biểu mẫu khách hàng cần đối soát;
- duyệt wireflow `Chế độ bảng` và `Chế độ công việc` cho đơn vị và người chấm.

## Checkpoint tích hợp Admin — Tiếp nhận và kiểm tra, ngày 13/08/2026

Module local `/admin/scorecard-templates` hiện thực hiện vertical slice: **nhập Excel → kiểm tra dữ liệu → xác nhận bản nhập local**.

- người dùng chọn workbook `.xlsx` thật; tệp được đọc local trong trình duyệt;
- importer yêu cầu đúng hai sheet `Đại học, Cao đẳng` và `Điểm thưởng`;
- kết quả là bảng kiểm tra 27 hạng mục; inspector giữ đầy đủ 55 dòng chấm;
- các dòng tiếp diễn của mục 21 và 22 được giữ đúng phân cấp và điểm tối đa;
- Tổ/Phụ trách trong workbook được giữ làm provenance, không tự biến thành phân công có hiệu lực;
- diagnostics chỉ rõ năm nguồn, actor, tổng điểm thưởng, trần 25 và mâu thuẫn II.1;
- người dùng phải xác nhận đã đọc diagnostics trước khi `Xác nhận dữ liệu nhập`;
- sai định dạng, thiếu sheet hoặc thiếu hạng mục làm import thất bại rõ ràng;
- desktop giữ bảng làm vùng cuộn chính; mobile chuyển thành danh sách và inspector toàn màn hình.

Checkpoint prototype phía trên là lịch sử BA. Runtime hiện hành đã chuyển sang đăng nhập phiên và dữ liệu backend có nguồn; xem `15_REAL_DATA_CUTOVER.md` và trạng thái mới nhất tại `../PROGRESS.md`.
