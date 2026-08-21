# Walking skeleton full-stack — vòng đời I.01

> Tài liệu lịch sử: endpoint, actor header và dữ liệu I.01 mẫu đã bị loại khỏi runtime theo `D-2026-08-14-21`. Domain test được giữ để bảo vệ state machine; runtime hiện hành xem `15_REAL_DATA_CUTOVER.md`.

Cập nhật: 14/08/2026  
Phạm vi: local-only, một chiến dịch × một tiêu chí I.01 × một đơn vị × một hồ sơ × một Tổ thẩm định.

## 1. Kết luận

Đường đi chuẩn đã chạy xuyên frontend, API, domain, database và audit. Đây là bằng chứng kiến trúc và vòng đời có thể kết nối; không phải tuyên bố toàn bộ sản phẩm đã sẵn sàng vận hành.

`Phát hành bảng điểm → Đơn vị gửi → Mở vòng 1 → Tổ chấm vòng 1 → Công bố vòng 1 → Đơn vị giải trình → Mở vòng 2 → Tổ chấm vòng 2 → Admin lập → Admin khác duyệt → Admin có quyền công bố`

## 2. Actor local và ranh giới

| Actor fixture | Vai trò trong lát cắt |
| --- | --- |
| `superadmin-na` | Đọc projection vận hành đã lược dữ liệu; không đọc endpoint nghiệp vụ |
| `admin-cuong` | Phát hành/mở vòng/lập kết quả |
| `admin-linh` | Duyệt độc lập kết quả |
| `admin-minh` | Công bố kết quả |
| `unit-dhhp` | Gửi hồ sơ và giải trình của đúng đơn vị |
| `reviewer-truong` | Chấm case được giao ở hai vòng |

Header `X-Actor-Id` chỉ là identity provider của harness local. Bản vận hành phải thay bằng OIDC và resolve scope từ session/token phía server.

## 3. Bất biến đã hiện thực

- API mặc định từ chối; capability, actor và phase được kiểm tra lại ở server.
- Command dùng `expectedVersion`; thao tác từ tab cũ trả conflict thay vì ghi đè.
- `Idempotency-Key` cùng request được phát lại an toàn; payload khác với cùng key bị từ chối.
- Business write và `AuditRecord` nằm cùng transaction; validation lỗi không để lại quyết định/audit dở dang.
- Quyết định và giải trình là revision mới; vòng 2 không sửa vòng 1.
- Admin có thể trả hồ sơ trước vòng 1 với lý do bắt buộc; case quay về chờ và lần gửi lại tạo `SubmissionRevision` kế tiếp.
- Đơn vị không đọc được quyết định trước mốc công bố tương ứng.
- Kết quả cuối yêu cầu người lập và người duyệt khác nhau; snapshot công bố có checksum SHA-256.
- Superadmin chỉ đọc projection tiến độ, không nhận điểm, URL minh chứng, lý do hoặc actor của audit.

## 4. Bề mặt local

- `/admin/lifecycle`: Admin điều hành phase, lập/duyệt/công bố kết quả.
- `/unit/lifecycle`: Đơn vị gửi hồ sơ, giải trình và đọc kết quả được phép công bố.
- `/reviewer/lifecycle`: Tổ/cán bộ xử lý case đúng assignment.
- `/superadmin/lifecycle`: Giám sát hệ thống chỉ-đọc.
- `/api/walking-skeleton`: projection nghiệp vụ theo actor.
- `/api/platform/workflow-status`: projection vận hành lược dữ liệu.
- `app/contracts/openapi.yaml`: contract command và read model local.

## 5. Bằng chứng hiện hành

- Domain: 7 test cho transition/bất biến aggregate.
- API: 9 integration test cho auth, request lỗi, redaction, rollback, idempotency, optimistic conflict, trả/gửi lại và đường đi đầy đủ.
- Frontend: 21 unit/model test và production build.
- Browser: 12 route; full journey và nhánh trả/gửi lại bằng API; desktop/tablet/mobile; 0 console error và 0 runtime error.
- Bằng chứng giao diện được tái sinh bằng `app/frontend/e2e/admin-smoke.py`; ảnh chạy thử nằm ngoài Git.

## 6. Chưa thuộc phạm vi đã chứng minh

- Trả quyết định/gói thẩm định, đổi người chấm, mở lại sau vòng 1 và supersede kết quả mới chỉ được khóa trong đặc tả, chưa đi qua UI/API.
- Chưa nhập 55 dòng, chưa chạy nhiều đơn vị đồng thời và chưa đối soát tổng cuối bằng golden workbook.
- Chưa có OIDC/MFA, PostgreSQL vận hành, object storage, quan sát production, backup/restore hoặc kiểm thử tải.
- Quyền chính thức, SLA, cửa sổ giải trình và golden case vẫn cần khách hàng ký trước pilot.
