# UX & Architecture Lab — Hệ thống đánh giá chiến dịch

Trạng thái: **analysis-first, local-only**. Không triển khai môi trường public từ thư mục này.

Implementation local hiện hành: `../app/frontend` (Angular 22) và `../app/backend` (Spring Boot) dùng đăng nhập phiên và catalog 55 dòng được seed từ workbook có checksum. Walking skeleton I.01 chỉ còn là bằng chứng lịch sử/domain test; endpoint và dữ liệu mẫu đã bị loại khỏi runtime. Xem `ba/15_REAL_DATA_CUTOVER.md`.

## Mục đích

Lab là cổng kiểm soát trước khi viết lại ứng dụng chính. Mỗi quyết định lớn phải đi qua chuỗi:

`dữ liệu thật → mô hình nghiệp vụ → kiến trúc thông tin → ảnh mẫu → prototype local → kiểm thử → quyết định triển khai`

Bản React/Vinext trong `../web` được giữ như executable specification và regression harness cho quy trình đã kiểm chứng. Nó không phải design reference và không tự động trở thành nền production.

## Tài liệu

- `PROGRESS.md`: trạng thái các lát cắt và cổng kiểm thử hiện hành.
- `IMPLEMENTATION_ACCEPTANCE.md`: ma trận nghiệm thu cho vòng đời đầy đủ, tải, accessibility, TLS/secrets và backup.
- `DECISION_LOG.md`: quyết định nghiệp vụ đã xác nhận, có mã và hệ quả dữ liệu/UX.
- `PRODUCT_ARCHITECTURE.md`: ranh giới miền, kiến trúc DDD, stack và các quyết định kỹ thuật.
- `UX_ARCHITECTURE.md`: vai trò, task model, sidebar, màn hình và wireflow.
- `DESIGN_SYSTEM.md`: design principles, token chuẩn hóa và quy tắc component.
- `DESIGN_SPEC_V2.md`: redline định lượng cho grid, typography, color, component và motion.
- `brand/NAMING_AND_IDENTITY_EXPLORATION.md`: kiến trúc tên, so sánh phương án, concept logo và ranh giới SEO/noindex.
- `TABLE_READABILITY_REVIEW.md`: nghiên cứu chính thống và redline cho bảng danh mục nhập từ Excel.
- `SCORECARD_FOCUS_WORKBENCH_AUDIT.md`: audit trước/sau cho chế độ phân công toàn vùng nội dung.
- `MODULE_NAVIGATION.md`: phân hệ, role sidebar, contextual rail và route grammar.
- `HARNESS.md`: cách làm việc, quality gates và chiến lược kiểm thử.
- `COMPLETION_AUDIT_ADMIN.md`: ma trận yêu cầu – bằng chứng cho phạm vi Admin local đã hoàn tất.
- `specimen/`: mẫu HTML/CSS local có thể đo và tương tác; nguồn chính xác hơn ảnh AI.
- `prompts/`: prompt có phiên bản dùng để tạo ảnh mẫu.
- `mockups/`: đầu ra imagegen; là vật liệu duyệt thiết kế, không phải asset giao diện cuối.
- `../app/frontend/`: bản thực thi local của những phân hệ đã qua quyết định thiết kế; bắt đầu với Admin.
- `ba/`: BA Lab reverse-engineer workbook AS-IS, lựa chọn mô hình sản phẩm và backlog khám phá.
- `ba/11_ACCESS_HIERARCHY.md`: ranh giới Superadmin, nhiều Admin chiến dịch, grant và acceptance phân quyền.
- `ba/12_COMPLETED_RESULT_PREVIEW.md`: kịch bản 16 hồ sơ hoàn tất, công thức tổng hợp, truy vết và giới hạn công bố.
- `ba/13_WORK_LIFECYCLE.md`: state machine, quyền, revision, bốn mắt và acceptance cho đường đi end-to-end.
- `ba/14_FULL_STACK_WALKING_SKELETON.md`: phạm vi code, actor, endpoint và bằng chứng kiểm thử của lát cắt full-stack local.
- `../scripts/analysis/`: harness đọc công thức và tái sinh fixture ĐH/CĐ từ workbook nguồn; không chạy trong trình duyệt người dùng.

## Cổng chuyển sang code nghiệp vụ chiến dịch

Các luồng nghiệp vụ chấm điểm chỉ chuyển từ prototype sang implementation khi đạt đủ:

1. Vai trò, trạng thái chiến dịch và quyền mở lại hồ sơ được chủ sản phẩm xác nhận.
2. Sidebar và ba luồng chính (đơn vị, chuyên viên, chủ chiến dịch) được duyệt trên ảnh mẫu.
3. Công thức điểm, quy tắc không áp dụng và cách xử lý xung đột vòng chấm có ví dụ kiểm thử.
4. Danh mục minh chứng, giới hạn tệp/liên kết và chính sách lưu trữ được quyết định.
5. Definition of Done và dữ liệu nghiệm thu được ghi thành test, không chỉ mô tả bằng văn bản.

Phân hệ Admin được phép phát triển độc lập bằng fixture để kiểm chứng information architecture, responsive behavior và thao tác quản trị. Việc đó không mặc nhiên xác nhận các quy tắc chấm điểm còn đang phân tích.

## Nguyên tắc không thương lượng

- Một màn hình phục vụ một công việc chính.
- Điều hướng thay đổi theo vai trò; không dồn mọi chức năng vào một sidebar chung.
- Trạng thái và hành động dùng từ tiếng Việt cụ thể; màu không bao giờ là tín hiệu duy nhất.
- Quyền được kiểm tra ở server trên từng yêu cầu và mặc định từ chối.
- Mọi thay đổi nghiệp vụ quan trọng cùng giao dịch với audit record.
- Không có abstraction, dependency hay hạ tầng “để sau này có thể cần”.
