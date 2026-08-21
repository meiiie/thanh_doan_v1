# Tiến độ dự án local

Cập nhật: 22/08/2026
Trạng thái: **local release-ready**; toàn bộ cổng code/contract/supply-chain/performance/restore local đang xanh. Chưa deploy và chưa gọi là production-ready khi chưa có staging/UAT thật.

## Đã hiện thực

- Nhận diện local **Neko Đoàn** theo Neko Family v1: Neko Peek vector, biến thể nền tối/đơn sắc, favicon/app icon, web manifest, social card 1200×630, metadata và brand drift gate; khu vực nghiệp vụ tiếp tục bị chặn index ở HTML, `robots.txt` và `X-Robots-Tag`.
- Module `identity-access` đã **chốt local/UAT**: login identifier-first hai bước trên cùng URL, session/CSRF/forced password change/logout/role routing có hồ sơ kỹ thuật và regression; production vẫn có cổng riêng cho IdP/MFA, recovery, password blocklist và thu hồi phiên tập trung.
- UX refinement: login và đổi mật khẩu lần đầu dùng chung mặt phẳng toàn viewport, cột tác vụ 448 px và control 52 px; login giữ `Quay lại` không mũi tên, forced-change giữ một CTA chính và một hành động đăng xuất phụ. `Neko Interface Icons v1` dùng Phosphor Regular có provenance/checksum cho sửa và hiện/ẩn mật khẩu; hierarchy KPI theo nhóm, typography floor 12 px, dense control 40 px và active indicator không phụ thuộc riêng vào màu.
- Admin chiến dịch đã chuyển sang mental model **Bảng Tổng**: sidebar sáu đích, catalog 27 tiêu chí/55 dòng, metadata nguồn, lọc nội dung `27 / 22 / 5`, lọc trạng thái phân công, selection mới mở `Phân bổ` hoặc `Phân công` và route Phiên bản riêng. `Điều hành chấm` là projection chỉ đọc theo tiêu chí/cán bộ, có hàng việc cần xử lý và workbench hồ sơ theo tiêu chí: thấy đơn vị/dòng chưa gửi, link minh chứng, điểm tự chấm, người được giao, người chốt, lý do và timeline vòng 1–giải trình–vòng 2. Projection không có command sửa điểm và chỉ mở **Khóa vòng 1 & mở giải trình** khi mọi lượt hoàn tất, không thiếu lý do, không vượt khung. Đích `Tổ & cán bộ` là roster chỉ đọc, có hai chế độ Tổ/cán bộ, tìm kiếm và workload suy ra từ assignment + applicability. Drawer dùng roster thật: chọn Tổ → thấy SubAdmin1 `Theo dõi Tổ` và toàn bộ thành viên/workload → gán một `Cán bộ chấm` đang hoạt động trong Tổ. SubAdmin1 chỉ chấm khi được gán trực tiếp; `Xem Tổ` giữ đúng context; bulk phạm vi/người chấm không xóa dữ liệu của nhau.
- Superadmin đã dùng chung shell, sidebar thu gọn và sáu destination điều hành với Admin; group `Quản trị hệ thống` bổ sung `Cơ cấu tổ chức` và `Tài khoản & quyền`. `Điều hành chấm` đã được khóa bằng browser regression ở sidebar drawer; các liên kết ngữ cảnh Bảng Tổng/Phiên bản/Tổ và báo cáo giữ đúng workspace `/superadmin/*`, không rơi sang route Admin. Menu tài khoản không còn lựa chọn chuyển vai giả; chỉ giữ danh tính phiên và đăng xuất.
- Shell dùng chung cho mọi workspace có disclosure nhất quán theo viewport: desktop cho phép thu gọn/mở rộng sidebar `304 ↔ 88 px`, compact dùng drawer có nút đóng tại nguồn. Topbar desktop được loại bỏ; topbar compact chỉ giữ nút mở điều hướng, không lặp title/context, trạng thái phiên hoặc avatar ở Admin, Reviewer và Unit. Menu tài khoản tự đóng khi đổi route, đóng/thu gọn sidebar, bấm ngoài, nhấn `Escape` hoặc chuyển khỏi cửa sổ; `Escape` đóng menu trước rồi mới đóng drawer để giữ đúng thứ tự lớp.
- Workbook `Thông tin Website.xlsx` đã được chuẩn hóa local thành 5 Tổ, 25 cán bộ, 134 đơn vị và 164 thông tin đăng nhập. Provision idempotent lưu provenance đến từng dòng nguồn; Superadmin khóa/mở khóa tài khoản có audit, còn Admin chiến dịch chỉ sử dụng roster.
- Workspace Reviewer dùng mental model **tiêu chí trước, đơn vị sau**: `Công việc chấm` tổng hợp tiến độ theo tiêu chí; mở tiêu chí mới hiện danh sách đơn vị và inspector thẩm định. SubAdmin1 có `Theo dõi Tổ` chỉ đọc theo từng cán bộ; hàng chờ cá nhân vẫn chỉ chứa case được gán trực tiếp. Không có approval/chấm thay ngầm từ capability theo dõi.
- Workspace đơn vị tách `Tự chấm`, `Giải trình` và `Kết quả cuối`. API đơn vị che toàn bộ điểm thẩm định trong vòng 1; khi mở giải trình chỉ trả dòng bị giảm điểm. Dòng bằng/tăng điểm không được giải trình và không vào vòng 2. Kết quả cuối đọc duy nhất snapshot `PUBLISHED`; không lộ điểm vòng 2 hay snapshot đang chờ phê duyệt.
- Đăng nhập/logout bằng session server, CSRF, đổi mật khẩu lần đầu, timeout và deny-by-default trên từng resource scope.
- Superadmin có toàn quyền; nhiều Admin có quyền theo capability/scope; Unit và Reviewer chỉ thấy công việc thuộc phạm vi.
- Catalog workbook có nguồn: 27 hạng mục, 55 dòng, 83 điểm cơ bản, 69 điểm thưởng thô, trần 25 và SHA-256 provenance.
- Phân công khối/tổ/cán bộ; nộp điểm tự chấm và link minh chứng; trả hồ sơ, sửa và nộp lại.
- Chấm vòng 1; giải trình dòng bị giảm; chấm vòng 2 với toàn bộ ngữ cảnh.
- Snapshot cuối bất biến; chuẩn bị và phê duyệt bởi hai actor khác nhau; công bố; export Excel đối soát.
- UI theo vai trò cho Admin, Unit, Reviewer và Superadmin; kết quả cập nhật trong workbench bảng điểm.
- Migration Flyway V8 cho round 2 chọn lọc và snapshot có metadata vòng 2 nullable ở dòng không cần chấm lại; provenance roster, audit cùng transaction, optimistic version và idempotency cho lệnh không lặp.
- Clean Architecture được khóa bằng test: application không trỏ ra infrastructure/web; adapter chỉ triển khai port và không dựng HTTP/application view model.
- OpenAPI là nguồn sinh DTO Angular duy nhất; lint và generated-drift check nằm trong root check/CI.
- Frontend có 37 unit/characterization test trên 11 file; scorecard/accounts/shell/global style đã tách theo ownership, không tạo design-system framework mới. Regression mới khóa việc mở link minh chứng an toàn, provenance người chốt và chế độ Admin chỉ đọc. Role smoke kiểm tra cả `Điều hành chấm`, Reviewer criterion-first, giải trình/kết quả cuối, header compact 910 × 698 cho ba workspace, axe WCAG 2.2 AA, overflow và logout.
- Full gate 21/08/2026 đạt 21/21 backend test, gồm PostgreSQL migration V1–V8 và journey phân công → tự chấm → trả/nộp lại → vòng 1 → giải trình có chọn lọc → vòng 2 → bốn mắt → snapshot/export. Kiểm thử tải 134 × 55 mới nhất đạt p50 28,94 ms, p95 56,01 ms và max 66,11 ms với budget p95 250 ms; không có test bị skip.
- License gate kiểm 519 dependency frontend, 34 contract tool và 82 component Java; CycloneDX SBOM và hai image có cổng vulnerability độc lập.
- Diễn tập backup ra ngoài workspace, kiểm checksum và restore PostgreSQL cô lập đạt 55 dòng/Flyway V6 trong 3,38 giây.
- Gói single-VPS Linux đã có production Compose overlay, Caddy automatic TLS, image digest gate, file secrets/config tree, resource/log limits, preflight, HTTPS smoke, systemd, backup và restore drill. Gói chưa được deploy; registry/domain/VPS, staging UAT và kho backup mã hóa off-host vẫn là cổng ngoài repository.

## Dữ liệu runtime

Migration seed chỉ chứa chiến dịch, catalog bảng điểm, bốn khối và số lượng tổng hợp. Danh tính thật không nằm trong migration: `ops/provision-source-roster.ps1` nạp có kiểm soát từ manifest local đã đọc workbook, ghi provenance và audit, có thể chạy lại không tạo trùng. Điểm, minh chứng, quyết định và kết quả vẫn bắt đầu rỗng.

Sổ bàn giao 164 tài khoản nằm ở `outputs/<task-id>/Neko-Doan-danh-sach-tai-khoan-local.xlsx`; mật khẩu khởi tạo ngẫu nhiên và manifest chỉ nằm trong vùng Git ignore. Harness `uat.* / LAB-*` vẫn tồn tại riêng để regression và không được trộn với roster khách hàng.

## Cổng trước production

1. Khách hàng ký xác nhận roster đã nhập và quy trình bàn giao/thu hồi credential; ma trận phân công vẫn do Admin hoàn thiện trên Bảng Tổng.
2. UAT có người dùng thật bằng bàn phím và screen reader; xác nhận từ ngữ, công thức và mẫu Excel đối soát.
3. Cấp domain/chứng thư CA, secret manager/KMS, retention policy và đích backup thật ngoài máy ứng dụng.
4. Chạy performance/security test trên staging có cấu hình tương đương production, diễn tập phục hồi từ đích từ xa và ký biên bản RPO/RTO.
5. Chỉ deploy khi người dùng ra quyết định riêng; repository hiện không có hành động deploy.

Chi tiết acceptance và lệnh tái kiểm tra nằm tại `IMPLEMENTATION_ACCEPTANCE.md`, `../ops/RUNBOOK.md` và `../ops/LOCAL_READINESS_2026-08-20.md`.

Đánh giá vòng đời, seed nghiệm thu và danh sách khoảng trống theo mức P0/P1/P2 nằm tại [`audits/FULL_WORKFLOW_ACCEPTANCE_2026-08-21.md`](audits/FULL_WORKFLOW_ACCEPTANCE_2026-08-21.md).
