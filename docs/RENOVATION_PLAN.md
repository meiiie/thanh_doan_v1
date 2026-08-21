# Kế hoạch đại cải tạo Neko Đoàn

Cập nhật: 20/08/2026
Phạm vi: local-only; không deploy, không rewrite dữ liệu khách hàng và không sửa migration đã phát hành.

## 1. Kết luận điều tra

Repo không thiếu công nghệ; nó thiếu một đường sản phẩm duy nhất và các cổng buộc tài liệu, code, dữ liệu phải nói cùng một sự thật.

Baseline trước dọn dẹp:

- 388 file được track, toàn bộ lịch sử chỉ có một commit lớn `c125f58`, nên gần như không có lịch sử quyết định có thể review.
- Hai sản phẩm cùng tồn tại: React/Vinext/Cloudflare trong `web/` và Angular/Spring/PostgreSQL trong `app/`. Chỉ `app/` được compose, root CI và runtime hiện hành sử dụng.
- `scripts/check.ps1` báo backend thành công dù hai gate PostgreSQL bị skip khi Docker tắt.
- Frontend fail ngay `format:check` trên Windows; anti-slop đã có nhưng không được gọi từ `npm run check` hoặc CI.
- OpenAPI mô tả các path nhưng phần lớn response chưa có schema, client Angular vẫn tự khai báo DTO theo từng page và không có gate kiểm tra drift.
- Tài liệu runtime mâu thuẫn: backend README nói submission/review/results chưa nối endpoint trong khi controller và UI đã tồn tại.
- Frontend có 2 unit test; browser smoke rộng nhưng chưa thay thế kiểm thử hành vi cục bộ cho các command quan trọng.
- CSS có 1.001 dòng global và nhiều breakpoint riêng theo feature. Token màu khá nhất quán, nhưng nhịp responsive và ownership component chưa nhất quán.

Đã làm trong nhánh `codex/anti-slop-foundation`:

- giữ một runtime `app/`, loại 146 file prototype/ảnh sinh lại được;
- cắt 20.152 dòng theo Git và 26 dependency trực tiếp của stack cũ;
- nâng `oxlint` và `@oxlint/plugins` đồng bộ lên `1.79.0`;
- đưa đủ 15 luật anti-slop vào cổng `npm run check`;
- sửa cổng format đa nền tảng và buộc root check từ chối Testcontainers bị skip;
- sửa các đường dẫn/tài liệu trạng thái bị sai sau cleanup.

Kết quả gate ngày 20/08/2026:

- 0 application service import infrastructure/web; 0 infrastructure adapter dựng `*View`; architecture test khóa hai chiều phụ thuộc.
- OpenAPI đầy đủ operation/schema hiện sinh TypeScript DTO và chặn drift; page không còn tự khai báo response DTO.
- Frontend tăng từ 2 lên 18 unit/characterization test; scorecard/accounts/shell/global style đã tách theo trách nhiệm.
- CycloneDX SBOM, Trivy image scan, npm audit và license policy là bốn gate độc lập.
- Tải 134 × 55 đạt p95 21,78 ms với budget 250 ms; off-host adapter restore PASS 55 dòng/Flyway V6.
- Phần còn phụ thuộc bên ngoài repository là staging tương đương production và chữ ký UAT; tiêu chí ở `../ops/STAGING_UAT.md`, không có deploy trong đợt này.

## 2. Kiến trúc đích

Giữ modular monolith, không viết lại nền tảng:

```text
Angular SPA
    │ REST/JSON + session + CSRF
Spring Boot modular monolith
    ├─ access, organization          CRUD đơn giản
    ├─ campaign, scorecard           vòng đời/version
    ├─ assignment, submission        command + audit
    ├─ review                        quyết định append-only
    └─ result                        snapshot bất biến + export
    │
PostgreSQL + Flyway
```

Quy tắc sở hữu:

- Domain chỉ chứa bất biến nghiệp vụ, không phụ thuộc Spring, JDBC hoặc HTTP.
- Application service sở hữu authorization theo resource, transaction, idempotency và orchestration.
- SQL nằm ở infrastructure; không thêm generic repository/base service.
- Controller chỉ ánh xạ HTTP và Problem Details.
- Angular page composition không sở hữu hợp đồng API; DTO biên và parser sở hữu việc đó.
- Mỗi business write và audit record cùng thành công hoặc cùng rollback.
- Scorecard đã ban hành, submission revision, review decision và final snapshot là append-only/bất biến.

## 3. Chương trình cải tạo

### P0 — Foundation sạch và trung thực

Mục tiêu: một repo, một stack, một lệnh kiểm tra không xanh giả.

- Hoàn tất cleanup hiện tại; không rewrite Git history trong pha này.
- CI gọi đúng `npm run check`, trong đó có anti-slop.
- Docker/PostgreSQL không sẵn sàng thì gate đầy đủ fail rõ ràng, không skip im lặng.
- Thêm kiểm tra link nội bộ và tài liệu trạng thái để không tái sinh đường dẫn chết.
- Mỗi thay đổi tiếp theo là một commit/PR theo một mục đích; generated lock/migration tách khỏi diff hành vi khi có thể.

Exit: checkout sạch trên Windows/Linux chạy cùng cổng và cho cùng kết luận; không còn runtime thứ hai hay artifact sinh lại được trong Git.

### P1 — Khóa product truth bằng ví dụ nghiệp vụ

Mục tiêu: trước khi chỉnh UX hay domain, chốt đúng công việc của Thành đoàn Hải Phòng.

- Từ workbook nguồn, giữ bộ golden cases tối thiểu: dòng cơ bản, dòng thưởng, dòng nhiều tiêu chí chấm, không áp dụng, giảm điểm cần lý do, giải trình vòng 2 và trần thưởng 25.
- Mỗi case ghi Input → Actor/scope → Command → State trước/sau → Audit → Output Excel.
- Hợp nhất Lab còn lại thành năm nguồn: `BA_SOURCE`, `DOMAIN_RULES`, `UX_SPEC`, `ADR`, `PROGRESS`; tài liệu lịch sử chỉ được gắn nhãn archive.
- Xác nhận với khách hàng các điểm chưa có nguồn: danh sách 134 đơn vị, 5 Tổ, người có capability lập/duyệt/công bố, deadline và chính sách minh chứng.

Exit: mỗi transition quan trọng có ít nhất một ví dụ được khách hàng đọc hiểu và một test tự động cùng ngữ nghĩa.

### P2 — Hợp đồng API thực thi được

Mục tiêu: frontend, backend và OpenAPI không thể drift trong im lặng.

- Hoàn chỉnh schema request/response và mã Problem Details cho các path đang chạy; không thêm endpoint mới trong bước này.
- Chọn đúng một cơ chế nhẹ: sinh TypeScript DTO từ OpenAPI hoặc kiểm tra DTO bằng contract test. Không duy trì cả hai.
- Thêm gate so controller/path/status với contract; diff contract phải được review như thay đổi nghiệp vụ.
- Đưa correlation ID, idempotency key và optimistic version vào schema có ví dụ lỗi.

Exit: đổi sai field/path/status làm CI đỏ; page không tự khai báo lại response DTO.

### P3 — Hardening domain theo lát cắt dọc

Thứ tự: `assignment → submission → review → final result`.

Mỗi lát cắt gồm migration/constraint, domain rule, authorization âm, transaction/audit, API, UI, accessibility và export nếu liên quan. Trước khi tách file lớn phải thêm characterization test; chỉ tách khi ownership rõ.

- Assignment: 27/27 hạng mục đủ khối, Tổ, Reviewer trước ban hành; snapshot bất biến.
- Submission: scope theo organization, revision append-only, trả hồ sơ không sửa bản cũ.
- Review: scope đồng thời campaign/Tổ/cán bộ; giảm điểm bắt buộc lý do; vòng 2 thấy đúng giải trình.
- Result: 134×55, bonus cap, digest, bốn mắt, publish và export chỉ từ snapshot.

Exit: PostgreSQL test chạy thật, denial matrix đầy đủ và audit cùng transaction cho toàn bộ command của lát cắt.

### P4 — Đại cải tạo UX theo công việc, không theo dashboard

Ưu tiên trang bảng điểm/phân công vì đây là bề mặt công việc trung tâm.

- Giữ bảng chiếm vùng nội dung chính; header chỉ giữ campaign, trạng thái và hành động hiện thời.
- Dùng một cột neo mã/nội dung; thuộc tính dài mở trong inspector, không làm mọi hàng cao vô hạn.
- Bulk selection chỉ xuất hiện khi có dòng được chọn; phân khối/Tổ/cán bộ là một inspector có review summary trước lưu.
- Trạng thái luôn có chữ + thời điểm + actor; màu chỉ là tín hiệu phụ.
- Dùng density có chủ đích: 40 px control, 44–52 px row mặc định, 4 px spacing grid, tối đa ba cấp emphasis.
- Chuẩn hóa breakpoint theo nội dung (`640/960/1280`) và một chiến lược bảng mobile; bỏ các ngưỡng cục bộ tùy ý.
- Giảm `styles.css` về token/reset/primitive. Style feature ở component sở hữu nó; không tạo design-system framework riêng.
- Với Unit/Reviewer, cùng mô hình bảng nhưng default grouping theo việc: Campaign → Hạng mục → Đơn vị/case.

Exit: task test có cán bộ không chuyên CNTT hoàn thành năm việc chính không cần hướng dẫn; axe không vi phạm nghiêm trọng, keyboard không kẹt, không tràn document ở 390/1024/1512 px.

### P5 — Vận hành và an toàn production

- Session rotation/timeout/logout, CSRF và secure cookie có negative test.
- Secret chỉ qua secret manager/config tree; log không chứa mật khẩu, session, minh chứng.
- Backup off-host có checksum, restore rehearsal và biên bản RPO/RTO.
- SBOM Java, image scan, dependency audit và license review là cổng riêng, không suy diễn từ nhau.
- Load test dùng dữ liệu test 134×55 và budget truy vấn; ghi baseline p50/p95, kích thước export và memory.

Exit: staging tương đương production chạy restore, security/performance/UAT; production data và deploy vẫn cần quyết định riêng.

## 4. Mười issue đầu tiên

1. Merge cleanup/anti-slop foundation sau khi review diff xóa.
2. Làm Docker gate chạy xanh và ghi số test PostgreSQL thực tế, không chấp nhận skip.
3. Bổ sung unit test frontend cho auth guard, lỗi Problem Details và một command scorecard.
4. Hoàn chỉnh OpenAPI cho auth + scorecard read model; chọn generator hoặc contract test.
5. Hợp nhất DTO auth/scorecard khỏi page và chứng minh drift test thất bại đúng cách.
6. Viết golden cases từ workbook cho core/bonus/multi-row/cap 25.
7. Characterize và thu nhỏ `scorecard-catalog.page.ts/html/css` mà không đổi hành vi.
8. Chuẩn hóa breakpoint/token/layout trên scorecard trước, rồi mới lan sang Unit/Reviewer.
9. Characterize repository assignment và tách query/command theo use case nếu giúp giảm coupling.
10. Hợp nhất tài liệu Lab, gắn nhãn archive và thêm link checker.

## 5. Cổng chống tái slop

- Không merge khi `scripts/check.ps1` chưa xanh đầy đủ hoặc có test bị skip ngoài allowlist công khai.
- Không thêm dependency nếu PR không chỉ ra API chuẩn không đáp ứng được và chi phí loại bỏ.
- Không thêm abstraction trước implementation thứ hai hoặc ranh giới ownership đã đo.
- Không có button mô phỏng, dữ liệu giả hoặc actor selector trong runtime.
- Không commit screenshot/browser artifact; chỉ commit asset runtime có nguồn.
- Không dùng “refactor toàn bộ” làm đơn vị công việc; mỗi PR phải có acceptance chạy được và rollback rõ.
- Không gọi “production-ready” trước UAT, staging, restore và security/performance gate có bằng chứng.
