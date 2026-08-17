# Module and navigation architecture

## 1. Three spatial layers

```text
Role sidebar → Context rail → Inspector
where to work   which item     decide/inspect
```

- **Role sidebar** is stable across a session and contains areas the person is allowed to enter.
- **Context rail** appears only inside high-density workspaces and selects units, criteria, cases or versions.
- **Inspector** is not navigation; it shows evidence, comparison or the decision for the selected item.

Never display three navigation trees. A screen may contain one role sidebar and one context rail; the third pane must be content or an inspector.

## 2. Domain modules and UI ownership

| Domain module | Human question | Primary UI area | Context rail |
|---|---|---|---|
| `identity-access` | Ai có quyền gì và trong phạm vi nào? | Tài khoản & quyền | nhóm quyền / tài khoản |
| `organization` | Đơn vị và tổ chuyên môn được tổ chức ra sao? | Cơ cấu tổ chức | nhóm / đơn vị |
| `campaign` | Chiến dịch đang ở đâu và mốc nào có hiệu lực? | Tổng quan, Mốc thời gian | giai đoạn / mốc |
| `scorecard` | Đang chấm theo phiên bản và quy tắc nào? | Bảng tiêu chí | nhóm / tiêu chí / phiên bản |
| `submission` | Hồ sơ đơn vị còn thiếu gì? | Hồ sơ tự chấm, Minh chứng | nhóm / tiêu chí |
| `review` | Hồ sơ nào cần quyết định tiếp theo? | Hàng chờ, Giải trình, Đối soát | đơn vị / case / tiêu chí |
| `results` | Kết quả nào đã được chốt và vì sao? | Kết quả & đối soát | nhóm / đơn vị / snapshot |
| `audit` | Ai đã làm gì, khi nào, với đối tượng nào? | Nhật ký, Truy vết | bộ lọc sự kiện |

## 3. Sidebar by role

Badges below are permitted only when they count actionable work in the current campaign.

### 3.1 Superadmin hệ thống

Purpose: toàn quyền vận hành và quản trị hệ thống. Superadmin có thể mở mọi workspace nhưng hành động luôn ghi đúng danh tính và audit.

```text
Tổng quan hệ thống

NỀN TẢNG
  Chiến dịch
  Cơ cấu tổ chức
  Tài khoản & quyền

VẬN HÀNH HỆ THỐNG
  Tích hợp
  Nhật ký bảo mật
  Sao lưu & phục hồi
```

Navigation chính chỉ giữ Vòng đời, Bảng điểm nguồn và Tài khoản & quyền. Superadmin mở workspace Admin/Reviewer/Unit từ menu tài khoản khi cần; không nhân đôi toàn bộ sidebar. Quyền toàn cục không bỏ qua snapshot bất biến hoặc cơ chế hai người lập/duyệt.

### 3.2 Admin chiến dịch / campaign owner

Purpose: remove bottlenecks and govern the workflow.

```text
Tổng quan

ĐIỀU HÀNH
  Hồ sơ đơn vị           [action count]
  Thẩm định              [action count]
  Kết quả & đối soát     [action count]

CẤU HÌNH CHIẾN DỊCH
  Bảng tiêu chí
  Phân công
  Mốc thời gian

QUẢN TRỊ CHIẾN DỊCH
  Thành viên & quyền
  Nhật ký
  Xuất dữ liệu
```

Context rails:

- Hồ sơ đơn vị: state filters → unit list.
- Thẩm định: Vòng 1 / Giải trình / Vòng 2 → case list.
- Bảng tiêu chí: version → criterion groups.
- Kết quả: group → unit/snapshot.

### 3.3 Specialist team lead

Purpose: distribute work and resolve team-level exceptions.

```text
Tổng quan tổ

CÔNG VIỆC
  Hàng chờ của tổ        [action count]
  Phân công chuyên viên  [unassigned count]
  Giải trình             [action count]
  Đối soát điểm          [variance count]

THEO DÕI
  Tiến độ chuyên viên
  Đơn vị theo dõi
  Lịch sử quyết định
```

The queue rail groups by SLA state first (`Quá hạn`, `Hôm nay`, `Tiếp theo`), then by unit. Do not organize the first view alphabetically when urgency is the task.

### 3.4 Reviewer

Purpose: inspect evidence and make defensible decisions.

```text
Việc cần làm             [action count]
Đang thẩm định           [in-progress count]
Giải trình               [action count]
Đã hoàn thành

THEO DÕI
  Đơn vị theo dõi
  Lịch sử của tôi
```

Reviewer workbench:

```text
role sidebar | queue rail 280 | evidence/content ≥520 | decision inspector 360
```

Queue order: overdue → due soon → assigned time. Selection persists when moving between criteria. “Đã hoàn thành” is history and has no badge.

### 3.5 Unit

Purpose: complete a valid submission and respond to review.

```text
Việc cần làm             [action count]
Hồ sơ tự chấm
Minh chứng               [broken/missing count]
Giải trình               [action count]
Kết quả
Lịch sử hồ sơ
```

Submission workspace:

```text
role sidebar | criterion rail 264 | editor ≥560 | completion inspector 320
```

Criterion rail groups by scorecard section. Within a group: blocking errors first only in the task view; canonical numeric order in the editing view, so the structure remains predictable.

### 3.6 Auditor / inspection role

Purpose: independently trace results and anomalies without editing them.

```text
Tổng quan kiểm tra
Sai lệch cần xem         [anomaly count]
Kết quả đã chốt
Truy vết hồ sơ
Nhật ký nghiệp vụ
Xuất dữ liệu
```

The trace rail is chronological or entity-based, selectable by a two-option view control. It never exposes edit actions.

## 4. Secondary navigation inside modules

### Campaign

```text
Tổng quan
Mốc thời gian
Đơn vị tham gia
Quy tắc chuyển giai đoạn
```

These are page tabs below the campaign title, not new sidebar sections. Maximum four visible tabs; overflow goes into `Thêm` only when real items exist.

### Scorecard

```text
Version selector
├─ Nhóm 1
│  ├─ 1.1
│  └─ 1.2
├─ Nhóm 2
└─ Quy tắc không áp dụng
```

Version selector is above the criterion tree because version changes the meaning of the entire tree. A published version is visibly read-only.

### Submission

```text
Hồ sơ
├─ Nhóm / tiêu chí
├─ Rà soát lỗi
└─ Biên nhận gửi
```

`Rà soát lỗi` is a task view derived from validation, not another source of truth.

### Review

```text
Queue state → Review case → Criterion → Evidence/Explanation → Decision
```

This is a master–detail–inspector flow. Do not turn every level into tabs.

### Results

```text
Snapshot selector → Group/unit → Summary → Trace
```

Final snapshots are immutable. “Trace” explains the result; it never edits source rounds.

### Audit

```text
Saved filter → Event list → Event detail
```

Event detail contains actor, scope, action, object, before/after summary, reason and correlation ID. Technical logs remain separate.

## 5. Route grammar

Routes reflect task and stable identity, not implementation:

```text
/campaigns/:campaignId/overview
/campaigns/:campaignId/units
/campaigns/:campaignId/scorecard/versions/:versionId
/campaigns/:campaignId/submissions/:submissionId/criteria/:criterionId
/campaigns/:campaignId/review/queue
/campaigns/:campaignId/review/cases/:caseId/criteria/:criterionId
/campaigns/:campaignId/results/snapshots/:snapshotId
/campaigns/:campaignId/audit/events/:eventId
/superadmin/accounts
/superadmin/organizations
```

URLs preserve the selected campaign/case/criterion and survive refresh. Filter state uses query parameters. Ephemeral open/closed UI state remains local.

## 6. Permission and visibility rules

- Hide areas outside the person’s role/scope; do not present a wall of disabled links.
- If a task is visible but temporarily unavailable because of workflow state, keep it visible and state the reason.
- Switching campaign recalculates navigation counts and scope; it does not silently carry a selected unit from another campaign.
- Server authorization remains deny-by-default on every request. Sidebar visibility is guidance, never security.
- Deep links either open the requested permitted context or show a specific access/state explanation with a safe route back.

## 7. Navigation quality tests

1. Every screen answers “where am I” with role area + campaign + selected entity.
2. A person can reach the next actionable task in at most two navigation choices after login.
3. A badge count always equals the destination’s initial filtered list.
4. Back/forward and refresh preserve task context.
5. No role sees two entries that lead to the same work with different names.
6. No primary sidebar exceeds nine leaf items without evidence from usability testing.
7. Context rail selection remains keyboard reachable and announces count/state.
