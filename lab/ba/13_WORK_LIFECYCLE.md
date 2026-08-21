# BA — Vòng đời công việc từ ban hành đến công bố

> Cập nhật 14/08/2026: quyền Superadmin trong tài liệu này đọc theo `D-2026-08-14-20`; Superadmin có toàn bộ capability nhưng không được tự duyệt kết quả do chính cùng tài khoản lập.

Ngày chốt baseline local: 14/08/2026  
Trạng thái: **đủ ổn định để xây walking skeleton local**, chưa thay thế biên bản xác nhận nghiệp vụ của khách hàng.

## 1. Kết luận

Vòng đời cũ chưa hoàn chỉnh. Prototype đã chứng minh được chuỗi `phân khối → đơn vị nhập → cán bộ chấm → Admin tổng hợp`, nhưng còn thiếu các transition có hậu quả pháp lý/nghiệp vụ: nộp và khóa hồ sơ, trả/mở lại, công bố vòng 1, giải trình, vòng 2, duyệt bốn mắt, công bố cuối và sửa sai sau công bố.

Baseline này hoàn chỉnh đường đi chuẩn bằng bốn state machine liên kết. Không dùng một enum khổng lồ vì chiến dịch có thể đang ở giai đoạn vòng 1 trong khi từng hồ sơ/case có tiến độ khác nhau.

```text
CampaignPhase
  PREPARATION → SELF_ASSESSMENT → ROUND_1 → EXPLANATION
  → ROUND_2 → FINAL_REVIEW → PUBLISHED → CLOSED

SubmissionStatus
  DRAFT → SUBMITTED → RETURNED → RESUBMITTED → LOCKED

ReviewCaseStatus (mỗi vòng)
  QUEUED → IN_PROGRESS → COMPLETED → INCLUDED_IN_BATCH

FinalResultStatus
  CALCULATED → PENDING_APPROVAL → APPROVED → PUBLISHED → SUPERSEDED
```

`CANCELLED` là trạng thái kết thúc riêng của chiến dịch trước khi công bố. Nó không phải đường đi bình thường và luôn cần lý do/audit.

## 2. Đường đi chuẩn end-to-end

| Bước | Actor | Command | Điều kiện trước | Kết quả bất biến |
| --- | --- | --- | --- | --- |
| 1 | Admin có `scorecard.release` | Ban hành bảng điểm và mở tự chấm | draft đủ phạm vi/phân công, không còn blocker P0 | `ScorecardVersion` bất biến; campaign sang `SELF_ASSESSMENT` |
| 2 | Đơn vị trong scope | Nộp hồ sơ | đủ các dòng áp dụng, điểm/link hợp lệ, trong hạn | tạo `SubmissionRevision`; trạng thái `SUBMITTED`; dữ liệu revision chỉ đọc |
| 3 | Cán bộ được assignment | Hoàn thành vòng 1 | đúng case, đã kiểm tra minh chứng, điểm hợp lệ, có lý do nếu giảm | thêm `ReviewDecision(round=1)`; không sửa dữ liệu đơn vị |
| 4 | Tổ/Cán bộ | Gửi gói hạng mục | tất cả case thuộc hạng mục đã hoàn thành | tạo `ReviewResultBatch(round=1)` chỉ đọc |
| 5 | Admin có `explanation.open` | Khóa vòng 1 và mở giải trình | mọi lượt vòng 1 hoàn tất; mọi dòng giảm điểm có lý do | campaign sang `EXPLANATION`; không công khai bảng điểm vòng 1; đơn vị chỉ thấy dòng `round1 < self` cần xử lý |
| 6 | Đơn vị | Gửi giải trình | trong hạn; điểm vòng 1 thấp hơn điểm tự chấm | thêm `ExplanationRevision`; dòng bằng/tăng điểm không được giải trình; minh chứng bổ sung không ghi đè bản cũ |
| 7 | Cán bộ được assignment vòng 2 | Hoàn thành vòng 2 chọn lọc | dòng bị giảm đã có giải trình hoặc waiver hợp lệ | chỉ case `round1 < self` vào queue và thêm `ReviewDecision(round=2)`; case `round1 >= self` giữ `NOT_OPEN` |
| 8 | Admin có `result.prepare` | Lập kết quả cuối | tất cả case đã kết thúc; công thức/golden case đạt | tạo `FinalResultSnapshot` ở `PENDING_APPROVAL`, kèm checksum |
| 9 | Admin khác có `result.approve` | Duyệt kết quả | người duyệt khác người lập; snapshot/version còn hiện hành | snapshot sang `APPROVED` |
| 10 | Admin có `campaign.publish` | Công bố kết quả | snapshot đã duyệt, chưa bị supersede | snapshot/campaign sang `PUBLISHED`; chỉ đọc với mọi actor |

Walking skeleton đầu tiên chỉ dùng một campaign, một scorecard line, một đơn vị, một reviewer và ba tài khoản Admin tách capability lập/duyệt/công bố; sau khi đường đi này đạt test mới nhân lên 55 dòng × nhiều đơn vị.

## 3. Mở lại, trả về và sửa sai

### 3.1. Trả hồ sơ trước vòng chấm

- Admin có `submission.return` trả một hồ sơ đã nộp về đơn vị với lý do và hạn mới.
- Hệ thống không mở khóa revision đã nộp. Nó tạo revision kế tiếp ở `RETURNED`; đơn vị sửa và gửi thành `RESUBMITTED`.
- Review case sinh từ revision cũ bị hủy hiệu lực, không bị xóa. Case mới trỏ đúng revision mới.

### 3.2. Trả quyết định thẩm định

- Chỉ Admin có capability trả hồ sơ/decision được thực hiện thao tác này. SubAdmin1 không có quyền trả, duyệt hoặc sửa quyết định chỉ vì họ theo dõi Tổ.
- Bản quyết định đã gửi vẫn đọc được. Lần xử lý lại tạo revision mới và gói mới; Admin nhìn thấy “thay thế bản N”, không thấy một ô âm thầm đổi điểm.

### 3.3. Sau công bố cuối

- Không `UPDATE` snapshot đã công bố.
- Sửa sai tạo snapshot mới, phải nêu lý do, chỉ rõ snapshot bị thay thế và đi lại hai bước `prepare → approve → publish`.
- Snapshot cũ sang `SUPERSEDED` nhưng vẫn truy vết/tải được với người có quyền.

## 4. Quy tắc điểm cuối

Baseline local áp dụng quy tắc bảo thủ:

```text
finalLineScore = round2Decision.score nếu có quyết định vòng 2
                 ngược lại round1Decision.score

bonusApplied = min(sum(bonus finalLineScore), 25)
total = sum(core finalLineScore) + bonusApplied
rate = total / 83
```

Không có giải trình không đồng nghĩa điểm vòng 1 bị xóa. Vòng 2 chỉ thay thế giá trị hiệu lực của đúng dòng đã có quyết định vòng 2. Công thức `83`, cap thưởng `25` và ngưỡng xếp loại tiếp tục là oracle workbook; các bất nhất II.1/không áp dụng vẫn cần golden case khách hàng xác nhận trước production.

Quy tắc hiển thị bắt buộc:

- Trong `ROUND_1`, API đơn vị không trả điểm, lý do hay người chấm.
- Từ `EXPLANATION`, API đơn vị chỉ trả quyết định vòng 1 của dòng `round1 < self`; điểm vòng 2 vẫn ẩn.
- Đơn vị chỉ thấy đầy đủ điểm sau khi snapshot cuối đã duyệt bốn mắt và được công bố.
- Điểm hiệu lực khi lập snapshot là `round2` cho dòng bị giảm; ngược lại dùng thẳng `round1`.

## 5. Quyền và nguyên tắc bốn mắt

| Command | Scope | Capability tối thiểu | Không được phép |
| --- | --- | --- | --- |
| Nộp/giải trình | campaign + organization | chủ thể thuộc đúng đơn vị | đơn vị khác hoặc ngoài hạn |
| Chấm vòng 1/2 | campaign + team + assignment + line | reviewer được giao đúng vòng/case | biết `caseId` nhưng không có assignment |
| Trả/mở lại | campaign | capability riêng + reason + deadline | suy ra từ nhãn Admin chung |
| Lập kết quả | campaign | `result.prepare` | tự duyệt snapshot vừa lập |
| Duyệt kết quả | campaign | `result.approve` | cùng actor với người lập |
| Công bố | campaign | `campaign.publish` | Superadmin hệ thống nếu không có grant chiến dịch riêng |

Superadmin quản trị tài khoản/grant và vận hành hệ thống, không mặc nhiên quyết định điểm. Mọi endpoint deny-by-default và tự suy ra actor/scope từ phiên; frontend ẩn nút chỉ là hỗ trợ UX.

## 6. Audit, đồng thời và thời gian

- Mọi command thay đổi trạng thái và `AuditRecord` phải commit/rollback cùng transaction.
- Audit tối thiểu: `when, actor, action, aggregateType, aggregateId, from, to, reason, correlationId, version`.
- Command quan trọng nhận `Idempotency-Key`; gửi lặp không tạo thêm revision/snapshot.
- Aggregate dùng optimistic version; xung đột trả `409` cùng version hiện hành, không last-write-wins.
- Lưu thời gian UTC, đánh giá deadline theo `Asia/Ho_Chi_Minh`; hết hạn chính xác tại server.
- Snapshot phát hành giữ checksum trên nội dung chuẩn hóa để phát hiện dữ liệu bị thay đổi ngoài quy trình.

## 7. Biểu diễn UX theo vai trò

Không dựng một trang “workflow” chung cho người dùng thật. Mỗi workspace chỉ hiện việc của actor và một dải giai đoạn compact trong header.

- **Đơn vị:** bảng công việc giữ nguyên; footer sticky có mức đầy đủ, lỗi còn thiếu và hành động `Nộp hồ sơ`. Sau nộp toàn bảng readonly; nếu bị trả, banner nêu lý do/hạn và chỉ revision mới được sửa. Tab `Giải trình` chỉ xuất hiện khi vòng 1 đã công bố.
- **Cán bộ:** hàng chờ tách `Vòng 1` và `Vòng 2`; mỗi case hiển thị đúng submission revision. Quyết định hoàn tất bị khóa; gói gửi có số revision.
- **Admin:** bảng điểm tiếp tục là control surface. Mỗi dòng hiển thị nguồn trạng thái `chưa nhận / vòng 1 / có giải trình / vòng 2 / đã chốt`. Một action bar toàn chiến dịch chỉ mở command hợp lệ ở giai đoạn hiện tại.
- **Lãnh đạo/Admin duyệt:** trang preview kết quả chỉ đọc, nêu người lập, checksum, số ngoại lệ và nút duyệt. Người lập nhìn thấy lý do nút duyệt bị khóa.
- **Superadmin:** chỉ thấy sức khỏe tiến trình và audit hệ thống; không có nút sửa điểm/công bố.

Mọi command có hậu quả lớn dùng màn xác nhận nêu phạm vi, số đối tượng bị ảnh hưởng và yêu cầu lý do khi cần; không dùng modal chung chung “Bạn có chắc?”.

## 8. Acceptance cho walking skeleton

1. Đơn vị khác không đọc/nộp được hồ sơ dù biết ID.
2. Nộp thiếu link hoặc vượt điểm tối đa bị từ chối ở domain/API.
3. Nộp thành công khóa revision và ghi đúng một audit; gửi lặp cùng idempotency key không nhân đôi.
4. Reviewer khác/team khác không đọc hoặc chấm case.
5. Giảm điểm không có lý do và chưa xác nhận minh chứng đều bị từ chối.
6. Vòng 1 chỉ hiện cho đơn vị sau command công bố.
7. Giải trình quá hạn bị từ chối theo giờ Việt Nam.
8. Vòng 2 tạo decision mới, không update vòng 1.
9. Người lập không thể tự duyệt; Admin thứ hai duyệt được khi có capability.
10. Publish chỉ nhận snapshot `APPROVED`; sau publish mọi dữ liệu nguồn/snapshot readonly.
11. Sửa sau publish tạo snapshot superseding mới; lịch sử và checksum cũ còn nguyên.
12. API error là Problem Details có code ổn định; Angular hiển thị lỗi tiếng Việt gần hành động.
13. E2E đi trọn 10 bước trên desktop/mobile, không lỗi console và có thể truy audit từng bước.

## 9. Quyết định bảo thủ dùng cho local và câu hỏi cần ký trước production

Để không dừng walking skeleton, local dùng các mặc định có thể thay bằng cấu hình:

1. hai Admin khác nhau cho lập và duyệt kết quả;
2. Admin có capability riêng được trả hồ sơ/case, lý do bắt buộc;
3. cùng reviewer xử lý vòng 2 nếu assignment không được thay chính thức;
4. hết hạn giải trình thì giữ điểm vòng 1;
5. công bố theo toàn chiến dịch, không theo từng khối;
6. minh chứng MVP là URL; bổ sung trong giải trình là revision mới;
7. điểm vòng 2 có hiệu lực cuối trên dòng đã xử lý.

Khách hàng cần xác nhận hoặc thay thế bảy mặc định này trước khi pilot dữ liệu thật. Việc thay chính sách không được làm thay đổi nguyên tắc revision, scope, audit và snapshot bất biến.
