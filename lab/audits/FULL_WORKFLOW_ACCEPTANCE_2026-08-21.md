# Biên bản kiểm chứng vòng đời đầy đủ — 21/08/2026

Phạm vi: local/UAT, không deploy, không ghi dữ liệu production. Kết luận của biên bản tách rõ **logic lõi đã chứng minh** và **phần sản phẩm còn thiếu**; một test xanh không được diễn giải thành production-ready.

## 1. Seed nghiệm thu

`WorkflowApiIntegrationTest` tạo một bộ dữ liệu cô lập qua đúng API và database runtime, sau đó tự dọn. Seed gồm:

- 1 chiến dịch Hè 2026 và bảng điểm nguồn 27 hạng mục/55 dòng;
- 1 đơn vị kiểm chứng thuộc khối Đại học, Cao đẳng;
- 1 Tổ kiểm chứng;
- 1 tài khoản đơn vị;
- 1 Reviewer được giao trực tiếp và đồng thời có capability `Theo dõi Tổ`;
- 1 Reviewer cùng Tổ nhưng không được giao để chứng minh deny-by-default;
- 1 Admin thứ hai để chứng minh quy tắc bốn mắt;
- assignment cho đủ 27 hạng mục nhưng chỉ một tác vụ áp dụng cho đơn vị seed, giúp journey nhỏ mà vẫn kiểm tra readiness toàn bảng.

Seed này không trộn với 5 Tổ, 25 cán bộ và 134 đơn vị có provenance từ workbook khách hàng. Ba tài khoản `uat.*` ở database local chỉ phục vụ smoke theo vai trò; mật khẩu vẫn nằm ngoài Git trong `.tmp/local-uat-accounts.json`.

## 2. Journey đã chạy tự động

| Bước | Kết quả kiểm chứng |
| --- | --- |
| Tạo đơn vị, Tổ và tài khoản | Thành công qua API; account mới buộc đổi mật khẩu lần đầu |
| Phân bổ khối và phân công người chấm | 27/27 hạng mục sẵn sàng; phạm vi và assessor là hai quyết định độc lập |
| Ban hành bảng phân công | Chuyển `PREPARATION → SELF_ASSESSMENT`; lặp cùng idempotency key không tạo tác vụ trùng |
| Đơn vị tự chấm | Gửi điểm, URL minh chứng và mô tả; sinh revision 1 |
| Mở vòng 1 | Chuyển `SELF_ASSESSMENT → ROUND_1`; Reviewer thấy đúng một case được giao |
| Kiểm tra quyền ngang | Reviewer cùng Tổ nhưng không được giao không đọc/chấm được case; API trả `403` |
| Trả hồ sơ | Reviewer nhập lý do; đơn vị thấy trạng thái `RETURNED` và đúng lý do |
| Sửa, nộp lại | Đơn vị đổi minh chứng/mô tả; sinh revision 2, giữ lịch sử cũ |
| Chấm vòng 1 | Giảm điểm có lý do và xác nhận đã kiểm minh chứng; idempotency chống quyết định trùng |
| Điều hành Admin | Projection báo đủ lượt, không thiếu lý do, không vượt khung và cho phép khóa vòng 1/mở giải trình |
| Khóa vòng 1 & mở giải trình | Chuyển `ROUND_1 → EXPLANATION`; đây không phải công bố bảng điểm. API đơn vị chỉ trả dòng `round1 < self`; điểm vòng 1 không bị ghi đè |
| Giải trình | Đơn vị gửi nội dung và URL bổ sung; sinh explanation revision 1 |
| Mở và chấm vòng 2 | Chỉ dòng bị giảm vào queue; Reviewer nhận ngữ cảnh giải trình và ghi quyết định mới. Dòng bằng/tăng điểm giữ `NOT_OPEN` |
| Lập snapshot cuối | Chuyển sang `FINAL_REVIEW`; snapshot chứa đúng dữ liệu nguồn đã khóa |
| Bốn mắt | Người lập tự duyệt bị chặn `FOUR_EYES_REQUIRED`; Admin thứ hai duyệt thành công |
| Công bố kết quả | Chuyển `FINAL_REVIEW → PUBLISHED`; đơn vị chỉ đọc kết quả cuối từ snapshot bất biến |
| Export Excel | File XLSX hợp lệ, ba sheet, có minh chứng, người chấm và checksum SHA-256 |
| Audit | Ít nhất 31 audit record cho các command chính; business write và audit cùng transaction |

## 3. Cổng kỹ thuật đã chạy

- Backend: 21/21 test, 0 fail, 0 error, 0 skip.
- PostgreSQL 18 Testcontainers: migration V1–V8 từ database rỗng; V8 cho phép metadata vòng 2 vắng mặt ở dòng không cần chấm lại.
- Tải 134 × 55: projection kết quả 20 mẫu, p50 28,94 ms, p95 56,01 ms, max 66,11 ms, phản hồi 38.373 byte; budget p95 là 250 ms.
- Frontend: 36/36 test trên 10 file; format, anti-slop, brand gate và production build đạt.
- OpenAPI: lint đạt và generated Angular DTO không drift.
- Supply chain trong root gate: npm production audit, license policy và CycloneDX SBOM đạt.
- Browser: Superadmin/Admin, Reviewer và Unit đăng nhập bằng session thật; role/scope, logout, console, overflow và axe WCAG 2.2 AA đạt.
- Compact 910 × 698: cả Admin, Reviewer và Unit chỉ còn nút mở điều hướng trong topbar; không còn title/context, trạng thái phiên hoặc avatar lặp.

## 4. Kết luận theo bounded context

| Bounded context | Kết luận local/UAT | Ghi chú |
| --- | --- | --- |
| Identity & access | Đạt luồng password/session local | Chưa có IdP/MFA/recovery production |
| Organization roster | Đạt import/provenance/idempotency | Cần khách hàng ký xác nhận roster và bàn giao credential |
| Scorecard & assignment | Logic lõi đạt | UX Bảng Tổng còn cần UAT với phân công thật |
| Submission | Logic lõi đạt | Hiện hỗ trợ một URL minh chứng + mô tả cho mỗi dòng/revision |
| Review vòng 1/trả/nộp lại | Đạt | Phân quyền đúng assessor; SubAdmin1 không tự có quyền chấm thay |
| Giải trình/vòng 2 | Đạt | Giải trình là revision, không phải comment thread |
| Final result/four-eyes/export | Đạt | Snapshot bất biến và export cùng nguồn sự thật |
| Operations local | Gate code đạt | Không thay thế staging, CA/domain, secret manager và off-host thật |

## 5. Phần chưa hoàn thiện

### P0 — phải giải quyết trước khi coi là sản phẩm vận hành nhiều chiến dịch

1. **Đa chiến dịch chưa được hiện thực.** Nhiều application port/repository vẫn cố định `campaign-summer-2026`; UI không có campaign selector và chưa chứng minh cách ly hai chiến dịch chạy đồng thời. Đây là khoảng trống so với nhu cầu nhiều chiến dịch cùng lúc.
2. **Chưa có staging/UAT có chữ ký.** Chưa có kiểm thử người dùng thật, cấu hình tương đương production, CA/domain, secret manager/KMS và backup nằm ngoài máy ứng dụng.
3. **Chưa có browser golden journey toàn vòng đời với state seed nhìn thấy được.** Journey đầy đủ đã được chứng minh ở API/database; browser E2E hiện kiểm tra từng workspace trên trạng thái local trung thực nhưng chưa tự chuyển qua mọi phase và thao tác mọi form từ UI.

### P1 — cần chốt nghiệp vụ hoặc hiện thực trước pilot

1. Minh chứng hiện là một URL cho mỗi revision. Chưa có nhiều liên kết có nhãn, upload file/object storage, quét malware, giới hạn MIME/dung lượng hay kiểm tra link hỏng.
2. Giải trình là nội dung + một URL, chưa phải chuỗi trao đổi/comment có mention, người nhận, thông báo và lịch sử hội thoại.
3. Chưa có deadline/SLA, nhắc việc, escalation và notification center; người dùng phải tự vào hệ thống xem trạng thái.
4. Chưa có quy trình bàn giao/reassignment có kiểm soát khi vòng chấm đang mở hoặc cán bộ nghỉ; assignment hiện được thiết kế chắc nhất ở giai đoạn chuẩn bị.
5. Chưa có command sửa sai/supersede sau khi đã `PUBLISHED`; cần quyết định ai được mở, lý do bắt buộc và snapshot thay thế liên kết snapshot cũ.
6. Audit tồn tại và được kiểm thử ở database nhưng chưa có màn tra cứu audit dành cho Superadmin/kiểm tra viên.
7. `Lịch sử chấm` và `Kết quả` của Reviewer dùng lại worklist với tab lọc; chưa có báo cáo lịch sử bất biến, export riêng hoặc so sánh quyết định theo thời gian.
8. Load gate đo snapshot/result/export với 134 × 55, chưa đo concurrent submit/review writes, soak test hoặc latency qua mạng trên staging.
9. Accessibility mới có axe/keyboard automation; vẫn cần manual screen-reader và high-contrast UAT.

### P2 — nợ chất lượng không chặn local flow

1. `review-queue.page.css` là 10,46 kB, vượt warning budget 9 kB nhưng dưới error budget 12 kB; nên tách theo worklist/inspector/team-overview khi tiếp tục chỉnh trang này.
2. Báo cáo readiness và ảnh visual cần được tái sinh ở mỗi release candidate; không dùng ảnh cũ làm bằng chứng cho code mới.

## 6. Quyết định phát hành

**Có thể tiếp tục dùng làm local/UAT candidate cho một chiến dịch Hè 2026. Không được tuyên bố đã hoàn chỉnh cho production hoặc cho nhiều chiến dịch đồng thời.** Gate kế tiếp hợp lý là multi-campaign boundary + browser golden journey có seed theo phase, sau đó mới mở rộng minh chứng/notification theo quyết định nghiệp vụ.
