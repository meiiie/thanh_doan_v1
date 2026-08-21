# Design QA — Neko Đoàn login, password state

Status: **frozen for local/UAT on 20/08/2026**. Reopen only for an approved authentication use case, accessibility defect or threat-model change.

- Source visual truth: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-d9e35a7a-2789-4944-afa0-9f19cafccfd9.png`
- Expert review: `C:\Users\Admin\.codex\attachments\3a0bc248-00e0-458c-89c3-296edc414e29\pasted-text.txt`
- Implementation route: `https://127.0.0.1:4319/login`
- Source and implementation viewport: 1448 × 1086 CSS px.
- Implementation evidence:
  - `app/frontend/artifacts/login-password-reference-viewport.png`
  - `app/frontend/artifacts/login-password-filled-desktop.png`
  - `app/frontend/artifacts/login-tablet.png`
  - `app/frontend/artifacts/login-mobile.png`
- Side-by-side comparison: `app/frontend/artifacts/login-password-comparison.png` (source left, implementation right).

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- Container: the viewport is now the authentication surface. The previous large bordered frame and outer radius were removed, matching the expert's highest-priority correction.
- Proportion: the task column is 448 px, fields are 52 px, actions are 50 px and the main Neko mark is 64 px. These values follow the expert redlines rather than scaling the oversized elements in the visual concept literally.
- Optical balance: the task group sits five viewport-height units above geometric center on desktop and one unit above on mobile. Header, task and footer remain three independent alignment regions.
- Progressive behavior: identifier and password remain two states on one URL. There is no account-existence request, visible stepper or page transition.
- Back behavior: the password state has a full-width secondary `Quay lại` action and no `←` control. This is the user's explicit decision and intentionally overrides the expert note that preferred only an inline account edit action. The pencil action and `Quay lại` both return to the identifier field without clearing it.
- Component hierarchy: `Đăng nhập` remains the only primary action. `Quay lại` uses a white surface and neutral outline, so it does not compete with the black primary action.
- Interface iconography: pencil, eye and eye-slash are exact Phosphor Regular 2.1.1 SVGs in the governed `Neko Interface Icons v1` subset. They render at 20 px inside 48 × 48 px targets; Neko Peek remains a brand mark rather than becoming a functional glyph.
- Accessibility: icon-only controls keep explicit Vietnamese accessible names and tooltips; real field labels, 44 px-or-larger targets, password-manager semantics, keyboard focus transfer, a generic authentication error and WCAG 2.2 AA axe checks pass.

## Accepted deviations from the visual concept

- The product keeps the task-oriented heading `Đăng nhập vào Neko Đoàn` instead of `Chào mừng trở lại`, following the expert review and the internal-product context.
- Language, remember-login, legal and recovery controls are absent because no approved localization, persistent-session, policy or recovery use case currently exists. Adding them would create deceptive UI.
- Runtime accounts use administrator-issued usernames rather than email identifiers.
- The concept's icon language is retained, but functional SVGs come from a neutral open-source interface family rather than redrawing the Neko mascot as controls. This preserves recognition, provenance and small-size legibility.

## Comparison history

1. The prior implementation used a large bordered frame, a 400 px form and 48 px controls.
2. The frame was flattened into the viewport; form and control proportions were adjusted to 448/52/50 px; the task group was optically lifted.
3. The account edit action was placed inside the readonly identifier control, and the requested full-width `Quay lại` action was added without an arrow glyph.
4. Text-only edit/visibility controls were replaced with pencil, eye and eye-slash SVGs after a 20 px silhouette review; the initially considered Iconoir eye was rejected as too ambiguous at the target size.
5. Exact 1448 × 1086 source and implementation captures were combined and inspected. Remaining differences are the accepted semantic deviations above, not layout defects.

## Verification checklist

- [x] Exact source-sized comparison artifact.
- [x] Identifier-first disclosure on one URL.
- [x] Full-width `Quay lại` works and contains no arrow.
- [x] Edit and password-visibility controls use governed SVGs, change state correctly and retain accessible names.
- [x] No authentication request before password submission.
- [x] Desktop, tablet and mobile overflow checks.
- [x] WCAG 2.2 AA axe scan and keyboard focus checks.
- [x] Real login, generic failure, logout and protected-route regression.

final result (login): passed

---

# Design QA — đổi mật khẩu lần đầu

Status: **implemented and passed local design QA on 21/08/2026**. Product-owner visual acceptance is still required before this state is frozen.

- Implementation route: `http://127.0.0.1:4317/change-password`
- Visual evidence:
  - `app/frontend/artifacts/change-password-desktop.png` at 1512 × 982.
  - `app/frontend/artifacts/change-password-mobile.png` at 390 × 844.

## Findings

- The former split shell and promotional context were removed. Login and forced-change now share the same viewport, header, footer, 448 px task column, 64 px Neko mark, 52 px fields and 50 px actions.
- Three password fields remain visible because the server contract requires current, new and confirmation values in one atomic command; no decorative stepper or fake server verification was added.
- Each field has its own governed eye/eye-slash SVG control and accessible Vietnamese name. Revealing one value does not expose the other two.
- Validation preserves entered values, identifies and focuses the exact field for length, reused-password or confirmation mismatch, and masks all values after a server failure.
- Desktop/mobile horizontal-overflow checks, console checks and axe scan pass with zero violations.
- Component regression: five focused tests cover shared auth hierarchy, independent visibility controls, reused password, mismatched confirmation and successful role routing.

final result (forced first-login password change): passed local design QA

---

# Design QA — Admin chiến dịch, Bảng Tổng

Status: **implemented and passed local design QA on 21/08/2026**. Product-owner visual acceptance is still required before the module is marked frozen for local/UAT.

- Source visual truth: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-338a4e69-4b52-4907-8b4f-7434ac3c5272.png`
- Expert analysis: `C:\Users\Admin\.codex\attachments\095711b7-8a39-43fc-b0d4-7afdacfa4885\pasted-text.txt`
- Implementation route: `http://127.0.0.1:4317/admin/scorecard-templates`
- Source and implementation viewport: 1672 × 941 CSS px.
- Captured state: campaign-admin role, `PREPARATION`, all-criteria filter, page 1, no row selected, source panel collapsed.
- Implementation evidence:
  - `app/frontend/artifacts/campaign-admin-master-scorecard-reference-viewport.png`
  - `app/frontend/artifacts/source-scorecard-desktop.png`
  - `app/frontend/artifacts/assignment-drawer-source-roster.png`

## Findings

- No actionable P0, P1 or P2 design mismatch remains after the same-viewport comparison pass.
- Layout: the implementation preserves the 304 px quiet sidebar, full-height content plane, header/action balance, single divider, table-first hierarchy and compact identity anchor from the visual target. There is no desktop topbar competing with the campaign workspace.
- Navigation: the campaign-admin sidebar has exactly five destinations — Tổng quan, Bảng Tổng, Phiên bản, Kết quả & đối soát, Tổ & cán bộ. Phân bổ and Phân công are absent until selection, then behave as separate contextual commands.
- Typography and density: criterion content is 14 px/20 px, supporting rules are 13 px/19 px, and 84 px rows retain comparison rhythm without reproducing Excel grid noise. Scoring clauses are preferred over evidence prose when the source requirement separates them.
- Color and surfaces: active navigation, segmented control, phase, unresolved assignment and disabled release states use restrained neutral/semantic tokens. The implementation does not add KPI cards, gradients, decorative blobs or unnecessary container borders.
- Icons and assets: Neko Peek is the governed brand mark. Navigation, search, lock, close and chevron glyphs come from one Phosphor icon family through `@ng-icons`; there are no handcrafted inline SVG substitutes.
- States and interactions: search, section/status filters, pagination, row inspector, select-one/select-all, clear selection, Phân bổ-only and Phân công-only inspector modes, source reconciliation, disabled release and Phiên bản navigation are functional.
- Roster context: chọn Tổ hiển thị đúng `Người theo dõi Tổ`, tổng cán bộ chấm khả dụng/tài khoản khóa và đưa mọi Reviewer đang hoạt động thuộc Tổ vào dropdown `Cán bộ chấm`. SubAdmin1 chỉ có quyền chấm khi được gán cụ thể. Select/drawer dùng cùng control geometry với design system, không dùng native control chưa định dạng.
- Accessibility and resilience: semantic labels, focus-visible states, keyboard targets, axe WCAG 2.2 AA, desktop/mobile overflow and console-error checks pass. The mobile route preserves the table relationship through a controlled scroll container instead of turning rows into lossy cards.

## Accepted semantic deviations from the visual concept

- The reference tab counts `55 / 30 / 25` mix scoring-line counts with a table whose footer says 27 criteria. The implementation separates the concepts: metadata reports 55 scoring lines, while filters report the 27 visible business criteria as `27 / 22 / 5`.
- The reference contains illustrative assignments such as `Nguyễn Minh Anh` và `Trần Thị Thu Hà`. Roster hiện đã được provision từ workbook khách hàng có provenance, nhưng assignment vẫn để rỗng có chủ đích; vì vậy bảng tiếp tục hiển thị `Chưa phân bổ` và `Chưa phân công` cho đến khi Admin thực hiện command thật.
- The reference draws five sample rows while labelling pagination as 10 per page. The implementation uses an actual 10-row page in the page's natural scroll flow; the nested workbench scrollbar from the earlier pass has been removed.

## Comparison history

1. The previous Admin shell mixed platform administration, hardcoded campaign context and too many destinations; the scorecard presented operational detail before establishing the Bảng Tổng mental model.
2. The shell was reduced to five stable campaign destinations and a compact Hải Phòng/Admin chiến dịch identity anchor; the fifth is a read-only roster reference, not account administration.
3. The catalog was changed to one row per business criterion, with 55 detailed scoring lines retained in domain data/inspector, and contextual Phân bổ/Phân công commands added after selection.
4. The source screenshot and implementation were inspected together at 1672 × 941. The final pass increased content typography and extracted scoring clauses, leaving only the documented semantic deviations above.

## Verification checklist

- [x] Source and implementation compared together at the same 1672 × 941 viewport and state.
- [x] Five-item campaign navigation and compact user anchor.
- [x] Real metadata `55 dòng tính điểm · 4 khối · 134 đơn vị`.
- [x] Selection progressively reveals Phân bổ/Phân công and opens the correct isolated fieldset.
- [x] Search, filter, pagination, row inspector, source reconciliation and versions route.
- [x] Roster thật có provenance; không có assignment, score hoặc evidence giả trong runtime.
- [x] SubAdmin1 theo dõi Tổ/SubAdmin2 chấm trực tiếp, trạng thái khóa và bulk preserve được khóa bằng API/browser regression.
- [x] 36 frontend unit/characterization tests, production build, anti-slop lint and brand gate.
- [x] Browser smoke, role smoke, axe WCAG 2.2 AA, responsive overflow and console checks on the 4317 development loop.

final result: passed

---

# Design QA — Bảng Tổng, Operational Minimalism

Status: **implemented and passed local design QA on 21/08/2026**. The table remains the primary work surface; no deployment was performed.

- Source visual truth: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-1440bfff-5a7a-4a68-877d-b2947d80597e.png` at 1672 × 941 px.
- Expert handoff: `C:\Users\Admin\.codex\attachments\4e4b0e60-09a8-4498-8f88-e64bc6ac6a73\pasted-text.txt`.
- Implementation route: `http://127.0.0.1:4317/admin/scorecard-templates`.
- Implementation evidence:
  - `app/frontend/artifacts/scorecard-operational-desktop-inspector.png` at a 1670 × 939 CSS viewport and 1670 × 939 px, device scale factor 1.
  - `app/frontend/artifacts/scorecard-operational-compact.png` at a 910 × 698 CSS viewport; full-page capture 910 × 1340 px, device scale factor 1.
- State: campaign Admin, default table and single-criterion inspector open. The source and implementation desktop images were opened in the same comparison input at near-identical dimensions; no density normalization was required beyond the source's two-pixel outer-frame difference.

## Findings

- No actionable P0, P1 or P2 mismatch remains. The campaign topbar contains only the navigation trigger at compact widths; duplicate page title, Excel status, session status and avatar are absent from the campaign workspace.
- `Bảng điều hành` was removed. Title, metadata, compact command bar and table now form one continuous hierarchy, moving the first data row materially closer to the top of the page.
- The former height-constrained `overflow: auto` table region was removed. Desktop and 910 px regression checks prove the table does not create a nested vertical scrollbar, does not clip rows and does not cause horizontal page overflow. Narrow screens retain only a bounded horizontal table overflow.
- The assignment surface is a non-modal inspector: no scrim, no dimmed table and no elevation shadow. At desktop widths the main table yields 420 px to the inspector, so users retain row context while editing.
- The command bar remains a single 58 px visual band at the source viewport. Tabs no longer wrap when the inspector opens; search, status filter and table header remain aligned.
- Content remains the hero column. Scope, assessor and score columns use restrained fixed widths, unresolved assignment uses one quiet warning color and selected rows use a neutral background without the former black side accent.
- Typography, spacing and color continue to use the accepted Neko Đoàn tokens. The governed Neko mark and Phosphor-backed interface icons are unchanged; no generated, placeholder or code-drawn visual asset was introduced.
- Copy is task-specific and concise: `Tìm mã, nội dung, người chấm...`, `Thiết lập tiêu chí`, `Phân bổ phạm vi áp dụng` and `Phân công người chấm` preserve the established business vocabulary.
- A focused crop was not required: both full-view artifacts preserve readable 13–15 px table and inspector text at approximately 1670 px, so typography, controls, dividers and column alignment were directly inspectable.

## Comparison history

1. Initial evidence showed four redundant topbar elements, an inner table scrollbar nested inside page scroll, a modal scrim, a wrapped command bar and an oversized criterion title in the inspector header.
2. The implementation removed the redundant campaign context/actions and workbench heading, released table height to page flow, removed the scrim/shadow, reserved desktop inspector width, compacted controls and reduced the inspector heading to one line.
3. Post-fix evidence at 1670 × 939 and 910 × 698 shows a single calm work surface with an undimmed inspector and no nested vertical scroll. The automated browser harness also reports no axe WCAG 2.2 AA violations or console errors.

## Verification checklist

- [x] Source and implementation visually compared at near-identical desktop dimensions.
- [x] Header annotations 1–4 removed from the campaign workspace.
- [x] No nested vertical table scrollbar at 1512 px or 910 px.
- [x] No horizontal page overflow at 1512 px or 910 px.
- [x] Row opens inspector without a scrim; close, search and source disclosure remain functional.
- [x] Compact navigation trigger remains available after topbar reduction.
- [x] Frontend format, anti-slop lint, brand gate, 36 unit tests and production build pass.
- [x] Admin browser smoke, axe WCAG 2.2 AA and console-error gate pass.

final result: passed

---

# Design QA — SubAdmin1, theo dõi tiến độ Tổ

Status: **implemented and passed local design QA on 21/08/2026**. This extends the existing Reviewer workspace without changing its navigation or visual language.

- Business handoff: user clarification dated 21/08/2026; SubAdmin1 monitors team progress and only scores when explicitly assigned.
- Implementation route: `http://127.0.0.1:4317/reviewer/queue`
- Visual evidence:
  - `app/frontend/artifacts/reviewer-team-overview-desktop.png` at 1512 × 982.
  - `app/frontend/artifacts/reviewer-team-overview-mobile.png` at 390 × 844.

## Findings

- The existing reviewer task page remains the visual source: same shell, tokens, typography, border system and table-first interaction. No new route or competing navigation was introduced.
- SubAdmin1 receives a restrained read-only `Theo dõi Tổ` region above the personal queue. Four totals and per-member progress answer who is assigned, how many cases arose, what remains and what is complete.
- The surface explicitly states that monitoring does not allow scoring for, approving or editing another officer. The personal section is labelled `Việc tôi chấm`; backend writes still require the signed-in actor to match `review_case.reviewer_id`.
- SubAdmin2 receives `teamOverview = null`, so no team-wide information is rendered. SubAdmin1 can still have personal cases when a criterion assignment names that account.
- Desktop keeps all monitoring columns visible without decorative cards. Mobile preserves the exact table relationship in a bounded horizontal region; the page itself has no horizontal overflow.
- Component regression renders the monitor projection without edit controls. Backend integration proves a SubAdmin1 can score an explicitly assigned case while an unassigned same-team Reviewer cannot read or write it.

## Verification checklist

- [x] Team overview only for `review.team.overview`.
- [x] Personal queue remains filtered by actor id and team id.
- [x] No approval or score-edit capability inferred from SubAdmin1.
- [x] Desktop/mobile visual inspection using the existing Reviewer design system.
- [x] OpenAPI, frontend build/unit tests, backend workflow integration and role/browser smoke.

final result: passed

---

# Design QA — Admin chiến dịch, Tổ & cán bộ

Status: **implemented and passed local design QA on 21/08/2026**. Product-owner visual acceptance is still required before this page is frozen for local/UAT.

- Source page visual: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-18e78780-97d4-4eb3-b591-df57ae9c6f59.png`
- Source drawer visual: `C:\Users\Admin\AppData\Local\Temp\codex-clipboard-495c12d1-d213-4be6-a39d-74e947f8913c.png`
- Expert handoff: `C:\Users\Admin\.codex\attachments\68b01b34-c93a-4189-9c0c-8b8cebf83ab6\pasted-text.txt`
- Implementation route: `http://127.0.0.1:4317/admin/teams`
- Page viewport: source 1493 × 1054; implementation 1494 × 1054 CSS px.
- Drawer viewport: source and implementation 1672 × 941 CSS px.
- Same-input comparison artifacts:
  - `app/frontend/artifacts/team-directory-design-comparison.png`
  - `app/frontend/artifacts/assignment-drawer-design-comparison.png`

## Findings

- No actionable P0, P1 or P2 visual or interaction mismatch remains after the same-input comparison pass.
- The implementation preserves the source master-detail hierarchy, quiet white plane, restrained border system, compact 5-person team summaries and read-only identity. It reuses the governed Neko mark, sidebar geometry, type scale and Neko Interface icons already accepted in the product.
- Team/member tabs, shared search, team selection, member assignment disclosure and `team` query context are functional. The mobile view becomes one continuous, readable work surface without losing team/member relationships or introducing horizontal overflow.
- Workload values deliberately use live assignment/applicability data. The current source roster has no assignment plans, so the verified local page correctly reports zero instead of copying illustrative counts from the concept.
- The local UAT harness adds one clearly labelled `UAT local` team/member outside the five source-provenanced teams. It is not migration/production seed and the regression separately requires at least the five teams and 25 officers from the customer workbook.
- The drawer keeps existing allocation and assessor commands, adds a read-only team roster/workload preview and routes `Xem Tổ` with the selected team id. Any enabled Reviewer in the selected team is selectable; SubAdmin1 remains monitoring context unless explicitly assigned.
- There are no account/personnel CRUD controls on the Admin page. Locked accounts remain readable for historical context but are ineligible for new assignment.
- Unit tests, production build and campaign-admin role smoke pass; the page/drawer pass axe WCAG 2.2 AA with no browser console errors.

## Accepted semantic deviations from the visual concepts

- Real team/member names and empty assignment state replace illustrative identities and workloads in the images.
- Existing product navigation omits the concept-only workspace switcher because the signed-in campaign scope is already fixed by authorization and the compact identity anchor. Adding a non-functional switcher would create a false affordance.
- The team monitor and assessor rows use disclosure chevrons to reveal assigned criteria rather than account-management glyphs, because Admin is explicitly read-only.
- The drawer retains the required applicability fieldset above reviewer assignment. The concept crop shows only reviewer assignment, but the executable page must preserve both independent commands without losing current scorecard behavior.

## Verification checklist

- [x] Source and implementation page compared together at near-identical 1494 × 1054 viewport.
- [x] Source and implementation drawer compared together at 1672 × 941 viewport.
- [x] Team master-detail, flat member view, search and selected-team query context.
- [x] Workload derived from plan applicability; no illustrative values hardcoded.
- [x] Read-only Admin surface; roster mutation remains with Superadmin.
- [x] Five source teams and 25 source officers remain visible alongside explicit local-only UAT records.
- [x] Desktop/mobile screenshots, axe WCAG 2.2 AA, no overflow and no console errors.
- [x] Pure-model unit tests, production build and role-workspace browser smoke.

final result: passed

---

# Design QA — điều hành chấm, công việc chấm và kết quả

Status: **implemented and passed local design QA on 21/08/2026**. Đây là walking slice local/UAT; không có deployment hoặc dữ liệu production nào được thay đổi.

- Source visual truth:
  - `E:\Sach\Sua\duan_quan_ly_doan\thamchieu\ChatGPT Image 21_22_45 21 thg 8, 2026 (2).png`
  - `E:\Sach\Sua\duan_quan_ly_doan\thamchieu\ChatGPT Image 21_22_45 21 thg 8, 2026 (3).png`
  - `E:\Sach\Sua\duan_quan_ly_doan\thamchieu\ChatGPT Image 21_22_46 21 thg 8, 2026 (4).png`
  - `E:\Sach\Sua\duan_quan_ly_doan\thamchieu\ChatGPT Image 21_22_44 21 thg 8, 2026 (1).png`
- Implementation routes:
  - Admin: `http://127.0.0.1:4317/admin/review-control`
  - Reviewer: `http://127.0.0.1:4317/reviewer/queue`
  - Unit preliminary: `http://127.0.0.1:4317/unit/results`
  - Unit final: `http://127.0.0.1:4317/unit/final`
- Same-input comparison artifacts:
  - `app/frontend/artifacts/review-control-comparison.png`
  - `app/frontend/artifacts/reviewer-worklist-comparison.png`
  - `app/frontend/artifacts/unit-preliminary-comparison.png`

## Findings

- The four references were translated into one lifecycle, not four disconnected mock screens: Admin sees a read-only control projection; Reviewer works criterion-first and scores one applicable unit at a time; Unit sees preliminary deltas and may explain reduced lines; final results remain absent until the immutable snapshot is published.
- Admin `Điều hành chấm` reports blockers, criterion progress and assessor progress from actual assignment/applicability/submission/review data. The preliminary-publication command is enabled only when the server reports every required case complete and no integrity blocker remains.
- Reviewer level 1 groups personal work by assigned criterion; level 2 lists applicable organizations and opens a restrained scoring inspector. Round-one, return and round-two writes still pass through actor-, team- and case-scoped endpoints. The SubAdmin1 team monitor is explicitly read-only and confers no authority to score for another assessor.
- Unit `Kết quả sơ bộ` reads live round-one decisions and exposes an explanation only for reduced lines during the explanation phase. `Kết quả cuối` never falls back to mutable round-two data: before publication it returns an honest empty state; after publication it reads the signed-in organization's immutable final snapshot.
- Navigation, tabs, search, filters, inspector open/close, progress disclosure, explanation draft/submit, result-state empty screens and logout are executable. Tables use semantic or valid ARIA structure, visible focus and governed Neko Interface icons.
- The implementation preserves the accepted Neko Đoàn language: quiet white plane, one task hierarchy, restrained borders, compact semantic color, no KPI card wall, no decorative illustration and no invented runtime evidence or score.

## Accepted semantic deviations from the visual concepts

- The references use illustrative names, counts and completed work. The verified local database currently has different truthful assignment and submission states, so the implementation shows those real projections or explicit empty states instead of copying sample values.
- A Unit final-result screen is separated from preliminary results because a published final snapshot has a different immutability and authorization contract; visually merging them would obscure the lifecycle boundary.
- The Admin control tower does not allow inline score correction. Administrative monitoring and reviewer judgment remain distinct authority surfaces.

## Verification checklist

- [x] Four source images and implementation screenshots inspected together through side-by-side comparison artifacts.
- [x] OpenAPI is the shared contract for review control, criterion worklist and Unit final result.
- [x] Server-side campaign, team, assessor and organization scopes remain deny-by-default.
- [x] Preliminary publication readiness is calculated by the backend, not inferred by the button.
- [x] Published Unit result is sourced only from the immutable final snapshot.
- [x] 20 backend tests passed; PostgreSQL 18 migration/load Testcontainers đều chạy và đạt, 0 test bị skip.
- [x] 36 frontend tests across 10 files, formatting, anti-slop, brand gate and production build passed.
- [x] OpenAPI lint and authenticated role-workspace E2E passed, including axe WCAG 2.2 AA, overflow, console-error and logout checks.
- [x] Local frontend and backend are reachable at ports 4317 and 8081; no deployment was performed.

## Cross-workspace header regression — 21/08/2026

- Admin, Reviewer và Unit được kiểm tra riêng ở viewport compact 910 × 698.
- Topbar chỉ còn nút `Mở điều hướng`; không còn page title/context, dấu `Đã xác thực` hoặc avatar/tài khoản lặp.
- Ba ảnh bằng chứng hiện hành: `campaign_admin-compact-header.png`, `reviewer-compact-header.png` và `unit_member-compact-header.png` trong `app/frontend/artifacts/`.
- Axe WCAG 2.2 AA, page overflow, console error và logout đều nằm trong role smoke; không đánh giá bằng ảnh chụp đơn thuần.

final result (review and results surfaces): passed
