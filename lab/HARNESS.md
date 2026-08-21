# Development harness

## 1. Vai trò của harness

Harness biến kiến thức dự án thành kiểm tra lặp lại được. Tài liệu nền chỉ chứa bức tranh lớn và gotcha; quy tắc theo module đặt gần code; lint/test chạy tự động thay vì trông chờ trí nhớ của người hoặc agent.

Định hướng này bám theo thực hành của Anthropic về codebase lớn: context phân tầng, test/lint theo thư mục, bỏ qua generated output, codebase map gọn và dùng công cụ xác định thay cho prompt nhắc nhở.

Nguồn: https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start

## 2. Cấu trúc harness hiện tại

```text
AGENTS.md                       # bản đồ repo + lệnh cấp cao, giữ ngắn
app/frontend/AGENTS.md          # Angular conventions + local checks
app/backend/AGENTS.md           # DDD/module/transaction conventions
app/contracts/openapi.yaml      # contract HTTP hiện hành
app/backend/src/main/resources/db/migration/
                                # schema + seed catalog có provenance
scripts/analysis/generate-scorecard-seed.mjs
                                # sinh seed từ workbook/PDF nguồn
scripts/dev.ps1                 # một lệnh khởi động local ở cổng 4317
scripts/check.ps1               # quality gate; -Browser chạy thêm Playwright
scripts/node-runtime.ps1        # chọn Node LTS phù hợp, không phụ thuộc PATH hiện tại
app/frontend/e2e/admin-smoke.py # golden browser journey Superadmin/Admin
app/frontend/e2e/role-workspaces-smoke.py
                                # Admin/Reviewer/Unit role + compact shell regression
```

## 3. Quality gates

### Mọi thay đổi

- format/lint/typecheck phạm vi đã đổi;
- unit test tại module;
- không có secret hoặc generated artifact trong git;
- OpenAPI client không drift;
- migration chạy được từ database rỗng.

### Thay đổi domain

- test bất biến aggregate;
- application/use-case test với fake ports;
- module boundary verification bằng test kiến trúc nhẹ; chưa thêm Spring Modulith khi chưa có nhu cầu đo được;
- test concurrency/idempotency nếu thay command quan trọng;
- audit assertion: business write và audit cùng thành công/thất bại.

### Thay đổi UI

- component tests cho loading/empty/error/readonly/conflict;
- axe/WCAG smoke;
- keyboard flow;
- visual regression ở 1440×900, 1024×768 và 390×844;
- không snapshot toàn trang thiếu mục đích; chỉ bảo vệ component/workflow ổn định.

### Trước release

- golden journey cho 6 vai trò;
- import → tự chấm → vòng 1 → giải trình → vòng 2 → chốt → export;
- restore rehearsal từ backup;
- ASVS 5.0 profile phù hợp, dependency/license scan và threat model delta;
- đối soát tổng điểm giữa hệ thống và workbook mẫu.

## 4. Golden scenarios ban đầu

1. Đơn vị hoàn thành đủ, gửi một lần, nhận receipt.
2. Đơn vị thiếu minh chứng/điểm vượt trần bị chặn với lỗi tại tiêu chí.
3. Hai tab cùng sửa một tiêu chí: tab cũ nhận conflict, không mất dữ liệu.
4. Chuyên viên ngoài assignment không đọc/ghi được dù biết ID.
5. Vòng 1 giảm điểm, đơn vị giải trình, vòng 2 chấp nhận một phần; trace đầy đủ.
6. Tiêu chí không áp dụng không làm sai tổng/mẫu số.
7. Chủ chiến dịch mở lại có phạm vi và hạn; hành vi được audit.
8. Chốt sinh snapshot bất biến; export khớp snapshot.
9. Tài khoản bị khóa mất quyền trên request tiếp theo.
10. Link minh chứng hỏng được phát hiện và hiển thị như blocker.

Các scenario 1–6 và 8–9 đã có coverage API/domain ở mức phù hợp với slice hiện tại. Scenario 7 và 10 còn mở; kiểm tra link hỏng chưa được hiện thực. Journey browser đầy đủ qua mọi phase cũng là gate tiếp theo, không được suy diễn từ API test.

## 5. Definition of Done

Một slice chỉ hoàn thành khi:

- acceptance example được viết trước hoặc cùng lúc;
- domain rule không nằm trong controller/component;
- authorization được test ở API;
- trạng thái UI đầy đủ, không chỉ happy path;
- audit và observability đủ để điều tra;
- tài liệu/contract cập nhật;
- chạy được local từ hướng dẫn sạch;
- không thêm abstraction hoặc dependency nếu giải pháp nền tảng đủ dùng.

## 6. Tiến độ có thể kiểm chứng

Mỗi checkpoint ghi bốn mục: `đã quyết định`, `đã chứng minh`, `còn giả định`, `gate tiếp theo`. Không dùng tỷ lệ hoàn thành chủ quan. Ảnh mockup được version bằng tên use case; quyết định chấp nhận/từ chối ghi ngay cạnh ảnh.

## 7. Checkpoint — Admin local frontend (12/08/2026)

### Đã quyết định

- Admin là quản trị hệ thống, tách khỏi chủ chiến dịch và người chấm.
- Tám module: tổng quan, chiến dịch, nhập danh mục, tổ chức, tài khoản, tích hợp, audit, backup.
- Angular 22, standalone components, signals, `OnPush`, lazy route và fixture typed.
- Responsive theo ba chế độ: sidebar, rail, drawer; không deploy trong giai đoạn này.

### Đã chứng minh

- Production build thành công.
- Unit và domain invariant test đạt 5/5.
- Playwright đi qua 8/8 route; các luồng create/filter/lock/check/backup và nhập workbook thật chạy được trong phiên local.
- Viewport desktop 1512×982, tablet 1024×768 và mobile 390×844 không có page error hoặc console error.
- Browser smoke kiểm tra landmark, một `h1` mỗi route và tên truy cập cho control tương tác.

Lệnh kiểm tra trình duyệt:

```powershell
.\scripts\dev.ps1
# Mở terminal khác tại root:
.\scripts\check.ps1 -Browser
```

### Còn giả định

- Dữ liệu và receipt chỉ tồn tại trong bộ nhớ trình duyệt.
- Quyền, secret, audit bất biến, backup/restore và email chưa có backend để chứng minh.
- Loading/network conflict sẽ được hiện thực khi có API; không tạo độ trễ giả trong fixture đồng bộ.

### Gate tiếp theo

- Duyệt ngôn ngữ và luồng của từng module Admin trên bản local.
- Chốt contract của một bounded context trước khi scaffold backend; không nối đồng loạt cả tám module.

## 8. Checkpoint — BA workbook vào Admin (12/08/2026)

### Đã quyết định

- Bước hiện tại chỉ đọc workbook thành danh sách; phân bổ thuộc bước kế tiếp của Admin/chủ chiến dịch.
- Importer đích chỉ nhận dialect đã đăng ký, không xây spreadsheet engine tổng quát.
- Version chưa được publish khi còn blocker hoặc câu hỏi P0 chưa có biên bản.
- Nội dung Trung ương, quyết định áp dụng theo khối và phân công tổ là ba lớp dữ liệu độc lập.

### Đã chứng minh

- Giao diện biểu diễn đúng 2 semantic range, 141 ô vàng và vùng vật lý phình do style.
- 17 nhóm ánh xạ cột phân biệt actor nguồn, tín hiệu Excel và quyền đích.
- Formula map nhận diện shared formula, khoảng trống H35, cap 25 và mẫu số I3.
- Trình duyệt đọc trực tiếp workbook `.xlsx` thật, không chỉ nhận tên tệp.
- Dialect hiện yêu cầu hai sheet `Đại học, Cao đẳng` và `Điểm thưởng`, đủ 22 nội dung cơ bản và 5 nhóm thưởng.
- Các dòng tiếp diễn của mục 21 và 22 được gộp để đối soát đúng 83 điểm cơ bản; tổng nhóm thưởng thô là 69.
- Browser smoke kiểm tra file sai, import file thật, 27 hàng kết quả, cảnh báo năm 2025, disclosure nguồn, tìm kiếm không dấu, lọc trạng thái và bố cục mobile không kéo ngang.
- Route phân công dùng focus workbench: tên công việc ở topbar, sidebar là drawer, trang desktop không cuộn và bảng là vùng cuộn duy nhất cao trên 400 px.
- Workbook được đối soát lại bằng parser độc lập và render trực quan cả hai sheet; checksum nguồn được ghi trong tài liệu AS-IS.

### Còn giả định

- Kết quả import chưa được lưu backend và biến mất khi tải lại trang.
- Importer chưa hỗ trợ dialect khối khác hoặc workbook có cấu trúc mới.
- Chưa có quyết định phân bổ theo khối, ngoại lệ đơn vị hoặc snapshot ban hành.

### Gate tiếp theo

- Khách hàng xác nhận 27 hàng, tổng 83/69 và cách gộp dòng của mục 21–22.
- Sau xác nhận, triển khai bước 2: ma trận hạng mục × khối; backend import vẫn để sau khi dialect ổn định.

## 9. Checkpoint — vòng đời full-stack I.01 (14/08/2026)

### Đã quyết định

- Bốn state machine liên kết cho campaign, hồ sơ, case thẩm định và kết quả cuối.
- Admin lập và Admin duyệt là hai actor khác nhau; capability công bố tách riêng.
- Checkpoint I.01 phía dưới là lịch sử. Quyết định mới D-20 cho Superadmin toàn bộ capability/scope; runtime dùng session và không còn actor header/walking-skeleton.

### Đã chứng minh

- Spring Boot lưu command, revision, kết quả và AuditRecord trong transaction; hỗ trợ optimistic version và idempotency.
- 7 domain test + 9 API integration test đạt, gồm deny-by-default, request lỗi, redaction theo phase, trả/gửi lại và full journey.
- Angular đi hết luồng bằng API; 21 test frontend và production build đạt.
- Playwright kiểm tra 12 route, 25 ảnh desktop/tablet/mobile, 0 console error và 0 runtime error.

### Còn giả định

- Header actor chỉ dành cho local; production phải thay bằng OIDC/grant thực.
- Trả quyết định/gói thẩm định, đổi assignment, mở lại sau vòng 1 và supersede chưa có UI/API.
- Chưa chứng minh hiệu năng và đối soát cho 55 dòng × nhiều đơn vị.

### Gate tiếp theo

- Chuyển golden case workbook thành fixture nghiệm thu nhiều dòng/nhiều đơn vị.
- Hiện thực trả quyết định/gói thẩm định và đổi assignment có audit trước khi pilot.
- Chạy PostgreSQL-shaped integration, migration từ database rỗng và kiểm thử phân quyền theo resource scope.

## 10. Checkpoint — nền local dữ liệu nguồn và phiên thật (14/08/2026)

Checkpoint này thay thế các giả định runtime trong mục 7–9; các mục trước được giữ làm lịch sử quyết định.

### Đã chứng minh

- Runtime không còn actor selector, `X-Actor-Id`, endpoint dev/walking-skeleton hoặc fixture nghiệp vụ frontend.
- Migration từ database rỗng tạo 27 nhóm/55 dòng scorecard có tên tệp, semantic range và SHA-256; các bảng hồ sơ, minh chứng, review và kết quả khởi tạo rỗng.
- Session server, BCrypt cost 12, CSRF và deny-by-default hoạt động; Superadmin có toàn scope/capability nhưng không phá audit, snapshot hay nguyên tắc bốn mắt.
- Tài khoản mới bị server chặn nghiệp vụ bằng `428 PASSWORD_CHANGE_REQUIRED` cho tới khi đổi mật khẩu lần đầu.
- `ArchitectureBoundaryTest` cấm domain phụ thuộc Spring, servlet, persistence và SQL.
- `scripts/check.ps1` thất bại đúng khi backend/frontend/browser fail và quét marker mock bị cấm trong runtime.
- Profile `local` lưu database trong `.tmp`; test dùng database in-memory cô lập nên không đọc/ghi dữ liệu local của người dùng.
- 13 backend test, 2 frontend test, production build và browser journey desktop/mobile đều đạt.

### Gate tiếp theo

- Nhận danh sách đơn vị, tổ và danh tính cán bộ được khách hàng cho phép dùng; không tự sinh tên giả.
- Hiện thực organization/assignment cùng audit, sau đó mới mở lại luồng submission → review → final result trên dữ liệu thật.

## 11. Checkpoint — phân công → tự chấm → thẩm định thật (14/08/2026)

### Đã quyết định

- `Khối áp dụng` nằm ở hạng mục cha; mọi dòng chấm con kế thừa cùng phạm vi.
- `Tổ theo dõi` định tuyến hàng chờ, `Phụ trách` là đúng tài khoản Reviewer chịu trách nhiệm ghi quyết định.
- Bản phân công chỉ được ban hành khi đủ cả ba trường cho 27/27 hạng mục; sau ban hành là snapshot bất biến.
- Bảng Admin là projection điều hành duy nhất: trạng thái phân công, số hồ sơ đã gửi, số dòng đã chấm và người chấm mới nhất cùng xuất hiện trên dòng nguồn.

### Đã chứng minh

- Flyway V5 tạo quan hệ nhiều–nhiều hạng mục–khối, kế hoạch Tổ/cán bộ, version, foreign key và index trên PostgreSQL 18 thật.
- API lọc theo resource scope lấy từ session: Đơn vị theo `organization_id`; Reviewer phải khớp cả `team_id` và `reviewer_id`; Admin theo campaign grant; Superadmin có toàn scope.
- Business write và audit nằm cùng transaction; save/submit/review có optimistic version; các command ban hành, gửi hồ sơ và hoàn tất chấm có Idempotency-Key.
- Integration test đi trọn luồng bằng dữ liệu chỉ tồn tại trong test: tạo cơ cấu/tài khoản → phân 27 hạng mục → ban hành → đơn vị gửi → mở vòng 1 → reviewer chấm → Admin thấy người chấm và tiến độ. Replay cùng idempotency key không tạo revision/decision trùng.
- 15 backend test, gồm migration PostgreSQL; 2 frontend test và Angular production build đều đạt. Initial bundle 280,40 kB raw / 76,70 kB ước tính truyền.
- Runtime seed vẫn không chứa tên đơn vị, cán bộ, điểm hoặc link minh chứng giả; các bảng giao dịch bắt đầu rỗng.

### Còn thiếu trước pilot/production

- Vòng trả hồ sơ, giải trình, vòng 2, bốn mắt chốt kết quả và export đối soát workbook chưa được nối lại vào projection mới.
- Chưa có danh sách 134 đơn vị và danh tính cán bộ được khách hàng xác nhận để onboarding.
- Chưa có kiểm thử tải 134 × 55, WCAG/keyboard đầy đủ cho ba bảng mới và số Core Web Vitals từ trình duyệt staging.

### Gate tiếp theo

- Kiểm thử browser ba vai trò trên production composition, gồm denied-scope và conflict.
- Hiện thực trả hồ sơ → giải trình → vòng 2 → snapshot kết quả, giữ cùng mô hình revision/audit hiện tại.
- Đối soát tổng 83 + thưởng cap 25 và export final với workbook khách hàng trước pilot.

## 12. Checkpoint — cổng supply-chain cho bản production-like local (14/08/2026)

### Đã chứng minh

- Maven tạo CycloneDX SBOM ngay trong artifact Spring Boot; CI quét SBOM Java riêng thay vì giả định quét image luôn nhìn thấy dependency trong fat JAR.
- Trivy quét image frontend và backend: 0 lỗ hổng HIGH/CRITICAL có bản vá trong lớp hệ điều hành.
- Trivy quét 82 thành phần Java từ SBOM CycloneDX: 0 lỗ hổng HIGH/CRITICAL có bản vá.
- Sau khi dựng lại composition, PostgreSQL, backend và frontend đều healthy; UI trả HTTP 200 tại `127.0.0.1:4318` và giữ CSP/security headers.

### Giới hạn của kết luận

- Đây là readiness của vertical slice local, chưa phải phê duyệt production. Chưa có TLS/domain, secret manager, backup off-host đã diễn tập, staging observability và kiểm thử tải 134 × 55.
- Vòng trả hồ sơ, giải trình, vòng 2, bốn mắt chốt kết quả và export đối soát vẫn là gate nghiệp vụ tiếp theo.

## 13. Checkpoint — roster nguồn và workbench phân công (21/08/2026)

### Đã chứng minh

- `Thông tin Website.xlsx` được đọc thành đúng 164 danh tính: 1 Superadmin, 4 Admin, 5 SubAdmin1, 20 SubAdmin2 và 134 đơn vị; SHA-256 nguồn được khóa trong manifest local.
- Provision tạo 5 Tổ, 134 organization và 163 account có provenance đến dòng Excel; chạy lần hai tạo `0` record nhưng xác minh đủ cardinality.
- SubAdmin1 dùng capability `review.team.overview` để theo dõi Tổ, không nở role và không có approval assignment ngầm. API workbench trả `monitorName`, tổng cán bộ chấm khả dụng và số tài khoản khóa. Server chấp nhận mọi Reviewer đang hoạt động thuộc đúng Tổ, gồm SubAdmin1 khi được gán trực tiếp, và từ chối tài khoản khóa/sai Tổ.
- Superadmin khóa/mở khóa account và audit trong một transaction. Kiểm tra live khóa `th.01` làm Tổ Trường học đổi từ `5 khả dụng / 0 khóa` sang `4 / 1`, sau đó khôi phục.
- Bảng Tổng có lọc trạng thái, drawer Tổ → người theo dõi Tổ (context) → cán bộ chấm (assignment) và bulk command không xóa dữ liệu ngoài focus. Browser smoke desktop/mobile, axe, console, frontend gate và backend gate khóa luồng này.
- Shell regression khóa hành vi lớp tạm thời: menu tài khoản không sống qua route/drawer/window blur; click ngoài và `Escape` đóng có thứ tự; desktop rộng thu gọn sidebar `304 → 88 px`, compact có nút đóng drawer 44 px và không tạo lớp phủ treo.

### Dữ liệu nhạy cảm

- Manifest/mật khẩu nằm dưới `.tmp/`; sổ bàn giao nằm dưới `outputs/`; cả hai bị Git bỏ qua.
- Không ghi password vào log, migration, test fixture hoặc tài liệu. Tài khoản nguồn bắt buộc đổi mật khẩu lần đầu.
- Superadmin bootstrap được đối chiếu với dòng nguồn nhưng không tạo tài khoản Superadmin thứ hai.

## 14. Checkpoint — kiểm chứng vòng đời và shell mọi vai trò (21/08/2026)

### Đã chứng minh

- `scripts/check.ps1` đạt backend 21/21, frontend 36/36, PostgreSQL migration V1–V8, OpenAPI, SBOM/license, npm audit và production build. Browser smoke được chạy riêng trên bề mặt local đang hoạt động.
- Seed nghiệm thu cô lập đi hết assignment, release, submit, return/resubmit, round 1, selective explanation, selective round 2, four-eyes, publish, immutable unit result và XLSX export.
- Capacity seed 134 × 55 chạy trên PostgreSQL 18; result projection p95 47,86 ms với budget 250 ms.
- Compact regression 910 × 698 cho Admin, Reviewer và Unit chứng minh topbar chỉ còn nút điều hướng, không có context/session/avatar lặp, không tràn ngang và không vi phạm axe WCAG 2.2 AA.

### Còn mở

- Multi-campaign vẫn bị cố định vào chiến dịch Hè 2026.
- Browser chưa tự điều khiển toàn journey theo phase; trạng thái đầy đủ hiện được chứng minh ở API/database.
- Multi-evidence/file upload, comment thread, notification/deadline, active reassignment, audit UI và supersede snapshot chưa có quyết định hoặc implementation đầy đủ.

Biên bản chi tiết: [`audits/FULL_WORKFLOW_ACCEPTANCE_2026-08-21.md`](audits/FULL_WORKFLOW_ACCEPTANCE_2026-08-21.md).
