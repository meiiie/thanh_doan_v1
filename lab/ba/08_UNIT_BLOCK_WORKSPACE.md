# BA — Workspace Đơn vị theo khối

## 1. Kết luận nghiệp vụ

Bốn khối là bốn phạm vi tổ chức, không phải bốn loại người dùng. Một tài khoản thuộc một đơn vị; đơn vị thuộc một khối. Các tài khoản đơn vị dùng chung vai trò và cùng một phân hệ, nhưng chỉ nhìn thấy hạng mục được Admin phân cho khối của mình trong phiên bản bảng điểm có hiệu lực.

Quan hệ tối thiểu:

```text
UserAccount → Organization → UnitBlock
ReleasedScorecard → Criterion → CriterionApplicability → UnitBlock
Organization + ReleasedScorecard → Submission → LineResponse
```

Phạm vi công việc của một đơn vị là phép giao giữa `UnitBlock` của tổ chức và `CriterionApplicability` của snapshot đã ban hành. Không nhân bản bảng điểm thành bốn file và không gắn danh sách hạng mục thủ công lên từng tài khoản.

## 2. Quy tắc phân quyền

- Vai trò chung: `UNIT_MEMBER` (tên cuối sẽ chốt khi thiết kế IAM).
- Phạm vi tài nguyên đến từ tổ chức trong phiên đăng nhập, không đến từ tham số do trình duyệt gửi lên.
- Mọi truy vấn hồ sơ và minh chứng phải kèm `organizationId` và `campaignId`; server từ chối mặc định nếu tài khoản không thuộc phạm vi.
- Nhiều tài khoản có thể cùng thuộc một đơn vị mà không làm thay đổi danh mục hạng mục.
- Bộ chọn bốn tài khoản trên prototype chỉ phục vụ duyệt UX. Bản vận hành không cho người dùng tự đổi sang tổ chức khác.

## 3. Nguồn danh mục trong prototype

Workbook hiện có là bảng khối Đại học/Cao đẳng, vì vậy chỉ có 27 hạng mục của khối này là dữ liệu nguồn đã kiểm chứng. Không bịa danh mục của Xã/Phường, Công chức hay Lực lượng vũ trang.

Luồng local hiện tại:

1. Admin tích `Khối áp dụng` trên từng hạng mục.
2. Admin bấm `Lưu bản nháp`.
3. Workspace Đơn vị đọc bản nháp cùng phiên trình duyệt.
4. Tài khoản mẫu chỉ thấy các hạng mục có khối trùng với tổ chức của mình.
5. Khối chưa được tích chọn nhận empty state rõ ràng, không nhận dữ liệu giả.

Bản vận hành phải thay bước 2–3 bằng `Ban hành snapshot → API đọc snapshot`. Đơn vị tuyệt đối không thấy thay đổi nháp chưa ban hành.

## 4. Màn hình `Bảng công việc được giao`

Route local: `/unit/tasks`.

Đơn vị tiếp tục làm việc theo mô hình bảng quen thuộc từ Excel và màn Admin. Một dòng chấm của nguồn tương ứng một dòng nhập trên web; không tách hạng mục sang inspector riêng vì việc đó làm mất ngữ cảnh đối chiếu.

Bảng có tám cột: `STT`, `Mã`, `Nội dung và yêu cầu`, `Điểm tối đa`, `Tự chấm`, `Link minh chứng`, `Báo cáo tóm tắt`, `Trạng thái`. Header và hai cột định danh được giữ khi cuộn; yêu cầu dài dùng disclosure ngay trong ô. Tìm kiếm, lọc và lưu nháp nằm trên cùng một toolbar của bảng.

Thông tin tổng quan được nén thành một dải gồm đơn vị/khối, số hạng mục, số dòng chấm, số dòng đủ dữ liệu và tổng điểm tự chấm. Sidebar giữ các module tương lai ở trạng thái vô hiệu để không giả lập chức năng chưa tồn tại.

## 5. Quy tắc bản nháp

- Bản nháp được tách theo `accountId` trong prototype để kiểm chứng không rò dữ liệu khi đổi tài khoản mẫu.
- Một hạng mục chỉ hoàn tất khi mọi dòng chấm có điểm hợp lệ, link minh chứng và báo cáo tóm tắt nếu dòng nguồn yêu cầu.
- Điểm phải nằm trong `[0, maximum]`; link chỉ nhận `http` hoặc `https`.
- `Gửi hồ sơ` tiếp tục bị khóa vì chưa có backend, thời hạn nhận hồ sơ, snapshot có hiệu lực và audit transaction.

## 6. Acceptance đã tự động hóa

- Tài khoản ĐH/CĐ nhận đủ 27 hạng mục nguồn.
- Hạng mục được Admin bổ sung cho Xã/Phường xuất hiện ở tài khoản Đoàn phường sau khi lưu bản nháp.
- Bảng có đúng tám cột nghiệp vụ và giữ cuộn ngang/dọc trong vùng làm việc thay vì làm tràn trang.
- Hai khối chưa được giao hiển thị empty state và không thấy hạng mục.
- Điểm/link của một tài khoản không xuất hiện khi chuyển sang tài khoản khác; quay lại vẫn giữ bản nháp đã lưu.
- Desktop 1512×982 và mobile 390×844 không tràn ngang, có đúng một `main`, một `h1`, tên điều khiển đầy đủ và không có lỗi console/runtime.

## 7. Phần chưa quyết định

- Một đơn vị có cần ngoại lệ riêng ngoài phạm vi theo khối hay không.
- Cơ chế khóa hồ sơ theo hạn, xin mở lại và ủy quyền nhập thay.
- Minh chứng `internal/document/guided` sẽ dùng link, tệp tải lên hay đối soát hệ thống nội bộ ở từng hạng mục.
- Trạng thái chính thức của hồ sơ và quy trình thu hồi sau khi gửi.
