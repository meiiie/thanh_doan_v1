# BA — Tổ theo dõi, cán bộ phụ trách và luồng thẩm định

Ngày phân tích: 13/08/2026  
Phạm vi: workbook ĐH/CĐ, vertical slice thẩm định vòng 1, local-only.

## 1. Trả lời câu hỏi nghiệp vụ

Đúng theo hướng nghiệp vụ đang được đặt ra: cán bộ của các Tổ chuyên môn tiếp nhận những nội dung đơn vị đã tự chấm và gửi, đối chiếu yêu cầu, xem minh chứng/báo cáo, sau đó nhập điểm thẩm định. Tuy nhiên hai cột không đồng nghĩa:

- `Tổ theo dõi` xác định nhóm chuyên môn chịu trách nhiệm hướng dẫn, điều phối và thẩm định hạng mục.
- `Phụ trách` xác định cán bộ xử lý chính của dòng chấm trong Tổ đó.

Một phân công Admin trên một dòng tiêu chí không phải một hồ sơ thẩm định. Sau khi bảng điểm được áp dụng cho các khối và các đơn vị gửi hồ sơ, phân công này sinh ra nhiều review case:

```text
ScorecardLine + Team/Officer assignment
  × submitted unit responses in applicable blocks
  = reviewer queue cases
```

Ví dụ: Admin giao `I.01` cho `PT · Đ/c Trường`; nếu 16 đơn vị ĐH/CĐ đều gửi, hàng chờ của Đ/c Trường có 16 case `I.01`, mỗi case giữ điểm tự chấm và minh chứng riêng của một đơn vị.

## 2. Bằng chứng trực tiếp từ workbook

Sheet `Đại học, Cao đẳng` có 12 header:

- `D — Tổ theo dõi`;
- `E — Phụ trách`;
- `G — Tự chấm`;
- `H — Được chấm`;
- `K — Link minh chứng`;
- `L — Lý do trừ điểm`.

Sheet `Điểm thưởng` giữ cùng cấu trúc actor với `G — Tự chấm`, `H — Được chấm`, `I — Link minh chứng`, `J — Báo cáo tóm tắt kết quả`. Công thức kết quả lấy dữ liệu `Được chấm` ở cột H, không lấy `Tự chấm` làm kết quả cuối.

Màu vàng ở sheet chính không phải bằng chứng quyền đáng tin cậy vì tô cả `Được chấm` và `Link minh chứng`, trong khi sheet thưởng tô đúng vùng đơn vị nhập. Vì workbook không có protection/data validation, web phải phân quyền theo actor và trạng thái thay vì sao chép màu ô.

Ảnh render nguồn được lưu tại `../audits/reviewer-source-analysis/` để đối soát header và vùng nhập.

## 3. Giới hạn quyền của “Subadmin Tổ”

Tên gọi sản phẩm nên là `Tổ phụ trách` hoặc `Cán bộ thẩm định`; không cấp vai trò Admin hệ thống chỉ vì người dùng có quyền chấm.

| Năng lực | Cán bộ phụ trách | Không được phép |
| --- | --- | --- |
| Xem | tiêu chí được giao, điểm tự chấm, link/báo cáo, lịch sử case | case của cán bộ/Tổ khác nếu không được ủy quyền |
| Ghi | điểm thẩm định, lý do/nhận xét, xác nhận đã kiểm tra minh chứng | sửa tự chấm hoặc minh chứng gốc của đơn vị |
| Hoàn thành | quyết định trên case của mình khi đủ điều kiện | ban hành bảng điểm, sửa phân khối, sửa tài khoản |
| Sau hoàn thành | đọc quyết định bất biến | sửa trực tiếp; phải qua thao tác mở lại có lý do/audit |

Server về sau phải suy ra `teamId/officerId` từ phiên đăng nhập và assignment snapshot. Biết `caseId` không đủ quyền đọc hoặc ghi.

## 4. Trạng thái đề xuất

```text
UNIT_SUBMITTED
  → QUEUED
  → REVIEWING
  → LINE_COMPLETED
  → ROUND1_COMPLETED
  → ROUND1_PUBLISHED
  → EXPLANATION_REQUESTED (nếu có)
  → ROUND2_COMPLETED
```

Vertical slice hiện tại chỉ mô phỏng `QUEUED → LINE_COMPLETED` trên trình duyệt. `ROUND1_COMPLETED/PUBLISHED` vẫn bị khóa vì cần backend, audit transaction và quyền phê duyệt.

## 5. Quy tắc nhập quyết định

- `Được chấm` bắt buộc và thuộc khoảng `0..Khung điểm`.
- Cán bộ phải xác nhận đã kiểm tra minh chứng trước khi hoàn thành dòng. Đây là safeguard sản phẩm suy ra từ nhiệm vụ “kiểm duyệt minh chứng”, không phải công thức Excel.
- Khi `Được chấm < Tự chấm`, `Lý do trừ điểm` bắt buộc vì workbook dành riêng header này cho người chấm.
- Điểm và lý do của vòng sau không ghi đè vòng trước; mỗi lần hoàn thành tạo ReviewDecision mới trong bản thật.
- Minh chứng đơn vị đã gửi là snapshot đọc-only. Bổ sung trong giải trình phải tạo phiên bản mới có thời điểm/người nộp.

## 6. Giao diện vertical slice

Route local: `/reviewer/queue`.

Bảng 9 cột gồm `STT`, `Đơn vị`, `Mã`, `Nội dung và yêu cầu`, `Tự chấm`, `Minh chứng đơn vị gửi`, `Được chấm`, `Lý do / nhận xét`, `Quyết định`. Hai cột đầu được giữ khi cuộn ngang; toolbar có tìm kiếm, lọc và lưu nháp.

Bộ chọn tài khoản chỉ phục vụ duyệt UX local. Nếu phiên trình duyệt có bản nháp Admin với cả Tổ và Phụ trách, hàng chờ lấy phân công đó; dữ liệu “đơn vị đã gửi” vẫn là fixture mô phỏng, được cảnh báo rõ trên màn hình.

## 7. Acceptance đã tự động hóa

- Dòng chỉ vào hàng chờ khi khớp cả Tổ và cán bộ phụ trách.
- Phân công thiếu Tổ hoặc thiếu cán bộ không sinh quyền thẩm định.
- Điểm giảm nhưng chưa có lý do không thể hoàn thành.
- Chưa xác nhận xem minh chứng không thể hoàn thành.
- Hoàn thành một case khóa control trên dòng và lưu riêng theo tài khoản.
- Đổi sang cán bộ Tổ khác chỉ thấy case được giao cho cán bộ đó.
- Desktop/mobile giữ bảng trong vùng cuộn và không làm tràn `main`.

## 8. Câu hỏi cần xác nhận với khách hàng

1. Trưởng Tổ có được xem/chấm thay toàn bộ case của Tổ hay chỉ theo dõi và phân lại?
2. Có cơ chế cán bộ phối hợp/thay thế hay mỗi dòng chỉ có một người chính?
3. Người chấm có được cho điểm cao hơn tự chấm không; nếu có có bắt buộc ghi lý do?
4. Ai có quyền mở lại một quyết định đã hoàn thành?
5. Vòng 1 và vòng 2 do cùng cán bộ xử lý hay có thể chuyển người?
6. Khi link minh chứng hỏng, cán bộ trả bổ sung ngay hay chỉ giảm điểm rồi chờ giai đoạn giải trình?

## 9. Hàng chờ khi có nhiều chiến dịch, hạng mục và đơn vị

Tải công việc thực tế có ba chiều độc lập:

```text
Campaign
  → assigned ScorecardLine
    → submitted UnitResponse
      → ReviewCase
```

Nếu trộn ba chiều thành một bảng phẳng, 6 hạng mục được giao và 40 đơn vị gửi sẽ tạo 240 dòng lặp tên chiến dịch, mã và nội dung. Cách này giống dữ liệu xuất báo cáo hơn là không gian làm việc.

Vertical slice dùng ba tầng ngữ cảnh:

1. **Chiến dịch đang xử lý** — bộ chọn toàn cục, hiển thị giai đoạn và hạn xử lý; không cho phép quyết định của hai chiến dịch dùng chung định danh.
2. **Hạng mục đang xử lý** — bộ chọn tập trung, có số thứ tự, số đơn vị đã gửi, số đã thẩm định và số có chênh lệch; nút trước/sau hỗ trợ chấm tuần tự.
3. **Đơn vị đã gửi** — bảng quyết định bảy cột chỉ hiển thị hồ sơ của hạng mục đang chọn. Mã, nội dung và nguyên tắc chấm được đưa lên thanh ngữ cảnh một lần thay vì lặp lại trên mọi dòng.

Mặc định không cung cấp chế độ “tất cả chiến dịch trong một bảng”. Việc trộn các bộ tiêu chí, thời hạn và snapshot khác nhau làm tăng nguy cơ chấm nhầm ngữ cảnh. Một trang tổng quan danh mục chiến dịch có thể được xây sau; thao tác chấm luôn diễn ra trong đúng một chiến dịch và một hạng mục.

Khóa nghiệp vụ tối thiểu của một hồ sơ phải chứa `campaignId + scorecardVersionId + lineId + unitId + submissionVersion`. Bản nháp quyết định phải tách ít nhất theo `reviewerId + reviewCaseId`; chuyển tài khoản, chiến dịch hoặc hạng mục không được làm lẫn dữ liệu.
