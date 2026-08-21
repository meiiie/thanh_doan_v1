# Review and results — module contract

Updated: 22/08/2026
Status: implemented and verified local/UAT; no deployment.

## Purpose

Turn assignment + applicability into a traceable scoring workflow without copying workbook rows or allowing an administrative projection to become a second source of truth.

## Truth ownership

- `scorecard_plan` owns which unit groups, review team and assessor apply to a criterion.
- `submission` owns the unit's immutable submitted revision.
- `review_case` and append-only review decisions own round 1/round 2 operational truth.
- explanation revisions append to the submission/review history; they never rewrite round 1.
- `final_result`, `final_result_unit` and `final_result_line` own the immutable published snapshot.
- Admin and dashboard screens are projections only. They cannot edit a score.

## Role mental models

### Campaign Admin

Route: `/admin/review-control`

Reads `GET /api/admin/review-control`. The projection reports integrity blockers, progress by criterion and progress by assessor. Chọn một tiêu chí gọi `GET /api/admin/review-control/criteria/{groupId}/cases` để mở workbench chỉ đọc gồm mọi đơn vị/dòng áp dụng, kể cả hồ sơ chưa gửi. Inspector hiển thị điểm tự chấm, link minh chứng, người được giao, người thực sự chốt, quyết định hiện hành và lịch sử vòng 1 → giải trình → vòng 2. `Khóa vòng 1 & mở giải trình` remains disabled until the server reports `canOpenExplanation=true`. Đây là chuyển trạng thái vận hành, không phải công bố một bảng điểm sơ bộ cho đơn vị.

### Superadmin

Route: `/superadmin/review-control`

Superadmin dùng cùng projection và workbench với Campaign Admin, đồng thời có các destination quản trị cơ cấu/tài khoản. “Toàn quyền” nghĩa có thể thực hiện mọi capability điều hành trong campaign scope; không có nghĩa được sửa trực tiếp quyết định append-only, bỏ qua snapshot bất biến hoặc tự lập rồi tự duyệt kết quả.

### Reviewer / SubAdmin2

Route: `/reviewer/queue`

Level 1 groups personal cases by assigned criterion. Level 2 lists the applicable units and opens one scoring inspector. All writes continue through the existing scoped round-one, return and round-two endpoints.

### Team monitor / SubAdmin1

Uses the same Reviewer workspace. `review.team.overview` adds a read-only team progress disclosure. It grants no approval, score-edit or score-for-another-user capability. A monitor may score only when `assessor_id` explicitly names that account.

### Unit

- `/unit/results` là màn `Giải trình`: không hiển thị bảng điểm vòng 1; chỉ đọc dòng `round1 < self` và cho gửi giải trình trong `EXPLANATION`.
- `/unit/final` reads `GET /api/unit/results/final`. Before publication it returns `published=false` and no lines. After publication it returns only the signed-in organization's snapshot.

## Security and lifecycle invariants

1. Every query is scoped again on the server by campaign plus organization/team/assessor.
2. Không có “kết quả sơ bộ” được công khai: dòng bằng/tăng điểm vẫn ẩn và không vào vòng 2.
3. Chỉ dòng giảm điểm được mở vòng 2; snapshot dùng điểm vòng 1 cho dòng không cần chấm lại.
4. Unit final results never fall back to live round-two columns.
5. An Admin projection cannot issue a review decision.
6. Returned submissions and explanations append revisions; existing decisions/audit stay traceable.
7. Evidence URLs are rendered as external links with `noopener noreferrer`; no URL is fetched by the server-side projection.
8. `decidedByName` is read from the append-only decision actor, not inferred from the current assignment, so reassignment cannot rewrite provenance.

## Verification

- Backend workflow integration covers assignment, submit, return/resubmit, round 1, selective disclosure, explanation, selective round 2, four-eyes finalization, published unit snapshot and Excel export. Test ba biên `<`, `=` và `>` chứng minh chỉ biên `<` được lộ/mở lại.
- Frontend: 37 tests across 11 files; the review-control characterization test locks evidence-link safety, score reason, assigned assessor, decision actor and read-only disclosure.
- Browser role smoke covers Admin control tower, Reviewer worklist, Unit explanation/final results, axe WCAG 2.2 AA, overflow, console errors and logout.
- Full gate 21/08/2026 chạy Docker/PostgreSQL 18 thật: migration V1–V8 và tải 134 × 55 đều đạt, không có test bị skip. Journey vòng đời đầy đủ, ba ranh giới giảm/bằng/tăng điểm và architecture boundaries cùng đạt.
