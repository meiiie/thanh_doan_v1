# BA — Bàn giao kết quả từ Tổ phụ trách về Admin

Ngày phân tích: 14/08/2026  
Phạm vi: thẩm định vòng 1, vertical slice local, chưa có backend.

## 1. Đơn vị bàn giao

Không gửi từng lần thay đổi điểm và không để Admin đọc bản nháp cá nhân. Đơn vị bàn giao là một **gói kết quả hạng mục**:

Campaign + ScorecardVersion + ScorecardLine + Team/Reviewer + toàn bộ Unit ReviewDecision đã hoàn tất = ReviewResultBatch.

Ví dụ, Đ/c Trường phụ trách I.01 và có bốn trường gửi hồ sơ. Sau khi cả bốn dòng đã hoàn tất, hệ thống tạo một gói I.01 gồm bốn quyết định. Bảng tổng hợp Admin có một dòng I.01; mở dòng mới thấy bốn đơn vị.

## 2. Lý do không đồng bộ trực tiếp từng ô

- Admin không nhìn thấy điểm dở dang trong lúc cán bộ đang nhập.
- Một hạng mục được đối chiếu nhất quán giữa các đơn vị trước khi bàn giao.
- Gói giữ đúng người gửi, thời điểm, phiên bản bảng điểm và tiêu chí.
- Khi cần sửa sau gửi, hệ thống có thể tạo revision mới thay vì âm thầm ghi đè lịch sử.

## 3. Điều kiện gửi

Nút “Gửi hạng mục” chỉ khả dụng khi:

1. hạng mục có ít nhất một hồ sơ;
2. tất cả hồ sơ thuộc hạng mục đã ở trạng thái hoàn tất;
3. mỗi hồ sơ có điểm thẩm định hợp lệ;
4. đã xác nhận kiểm tra minh chứng;
5. hồ sơ giảm điểm đã có lý do;
6. gói cùng định danh chưa được gửi trước đó.

Định danh prototype gồm campaignId + scorecardVersionId + criterionId + reviewerId + round.

Trong bản thật cần thêm revision hoặc submission version vào ReviewCase. Việc ghi gói và AuditRecord phải nằm trong cùng transaction.

## 4. Trạng thái

REVIEW_DRAFT → LINE_COMPLETED → CRITERION_READY_TO_SUBMIT → BATCH_SUBMITTED → ADMIN_RECEIVED.

ADMIN_RECEIVED hiện là trạng thái đọc tự động ngay khi có gói gửi thành công, không phải một lần phê duyệt nghiệp vụ. Các bước REQUEST_EXPLANATION, RETURNED và ROUND1_PUBLISHED chưa được mở.

## 5. Bảng Admin

Điểm vào chính của Admin: `/admin/scorecard-templates` → chế độ `Kết quả thẩm định`.

Kết quả được ghép theo `criterionId` về đúng dòng mã của bảng điểm. Route `/admin/review-results` được giữ trong prototype như màn tra cứu phụ để đối chiếu vertical slice, không còn là ngữ cảnh làm việc chính được đề xuất.

Tầng tổng hợp giữ đúng một dòng bảng điểm và trả lời ba câu ngay tại chỗ:

- **Dòng nào đã cập nhật:** mã dòng có nhãn `Đã cập nhật`; dòng chưa nhận vẫn ghi `Chưa nhận kết quả`.
- **Điểm thay đổi thế nào:** tổng tự chấm → tổng được chấm và chênh lệch nằm trong cùng một ô.
- **Ai chấm, khi nào:** tên cán bộ, Tổ chuyên môn, số hồ sơ và `submittedAt` của gói mới nhất được nhìn thấy trực tiếp.

`submittedAt` là thời điểm gói hoàn tất được gửi về Admin, không được diễn giải thành lịch sử sửa ô. Prototype chưa có revision/audit history nên không giả lập “người sửa gần nhất”.

Tầng chi tiết, mỗi dòng là một đơn vị:

- đơn vị và khối;
- tự chấm;
- được chấm;
- chênh lệch;
- lý do/nhận xét;
- trạng thái đã kiểm tra minh chứng và liên kết nguồn.

Phần đầu chi tiết lặp lại nguồn gốc snapshot gồm Người chấm, Tổ chuyên môn, Nhận lúc và Phạm vi. Dòng đơn vị có chênh lệch được đánh dấu `Đã điều chỉnh điểm`; dòng không chênh lệch ghi `Giữ nguyên điểm` và không dùng màu cảnh báo.

Admin không sửa điểm trực tiếp trên bảng tiếp nhận. Nếu khách hàng xác nhận có quyền trả lại, thao tác đó phải tạo một transition có lý do và audit, không mở khóa âm thầm.

## 6. Acceptance đã tự động hóa

- Bốn hồ sơ nhưng mới hoàn tất một hồ sơ thì nút gửi bị khóa.
- Hoàn tất 4/4 làm nút gửi khả dụng.
- Gửi lần đầu tạo đúng một gói; gửi lặp cùng định danh không nhân đôi.
- Gói chứa bốn dòng, đúng campaign, scorecard version, hạng mục, Tổ và cán bộ.
- Chuyển sang Admin hiển thị một dòng tổng hợp và bốn dòng chi tiết.
- Chế độ `Kết quả thẩm định` trên bảng điểm hiển thị I.01 ngay cạnh I.02, I.03…; mở I.01 mới lộ bốn hồ sơ đơn vị.
- Dòng I.01 hiển thị trực tiếp `Đ/c Trường`, `Tổ Phong trào`, bốn hồ sơ và thời điểm nhận; không cần mở màn phụ để xác định nguồn kết quả.
- Chi tiết nguồn gốc lặp lại đúng người chấm/Tổ/thời điểm/phạm vi; đúng một hồ sơ giảm điểm có nhãn `Đã điều chỉnh điểm`, ba hồ sơ còn lại ghi `Giữ nguyên điểm`.
- Bảng tổng hợp tích hợp vừa vùng làm việc desktop, không cần cuộn ngang; mobile chỉ cuộn ngang bên trong bảng.
- Điểm trừ và lý do được bảo toàn trong snapshot.
- Bảng tổng hợp và chi tiết cuộn nội bộ trên mobile, tài liệu không tràn ngang.
- Bản nháp chưa gửi không xuất hiện phía Admin.

## 7. Câu hỏi discovery tiếp theo

1. Admin chỉ theo dõi hay cần bấm xác nhận đã nhận?
2. Ai được trả gói về cho cán bộ và có bắt buộc ghi lý do?
3. Trả một hồ sơ đơn vị hay trả toàn bộ hạng mục?
4. Khi gửi lại, Admin xem revision mới cạnh revision cũ hay chỉ xem bản mới nhất?
5. Khi nào kết quả vòng 1 được khóa toàn chiến dịch và công bố cho đơn vị giải trình?
