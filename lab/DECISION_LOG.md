# Nhật ký quyết định sản phẩm

Tài liệu này ghi các quyết định đã được người phụ trách sản phẩm xác nhận trong quá trình BA/UX. Quyết định mới không sửa lịch sử; nếu thay đổi, thêm bản ghi thay thế và dẫn lại mã cũ.

## D-2026-08-13-01 — Phạm vi vận hành có 4 khối

- **Trạng thái:** Đã xác nhận cho prototype local.
- **Bối cảnh:** PDF có một câu nói “5 loại bảng điểm” nhưng chỉ liệt kê 4 khối. Trước đây cán bộ tách workbook và đổi tên theo từng khối để quản lý.
- **Quyết định:** Web dùng đúng 4 khối có bằng chứng:
  1. Xã, phường, đặc khu — 114 đơn vị.
  2. Đại học, cao đẳng — 16 đơn vị.
  3. Khối công chức — 2 đơn vị.
  4. Khối lực lượng vũ trang — 2 đơn vị.
- **Hệ quả:** Không tạo khối thứ năm. Câu “5 loại bảng điểm” được giữ như sai lệch tài liệu nguồn, không còn chặn prototype Phân khối.

## D-2026-08-13-02 — Phân khối là quan hệ nhiều–nhiều theo hạng mục

- **Trạng thái:** Đã xác nhận.
- **Quyết định:** Một hạng mục có thể áp dụng cho một hoặc nhiều khối; một khối có nhiều hạng mục. Admin tích các khối áp dụng trên từng hạng mục.
- **Hệ quả dữ liệu:** Lưu `Applicability(criterionId, unitBlockId)`, không lưu một `unitType` duy nhất trên hạng mục và không nhân bản hạng mục thành bốn bản.
- **Hệ quả giao diện:** Bảng Admin có cột `Khối áp dụng`; bốn lựa chọn được nhìn thấy trực tiếp. Các dòng chấm con của cùng một hạng mục dùng chung một quyết định phạm vi.

## D-2026-08-13-03 — Tên workbook là nguồn gợi ý phạm vi, không phải mô hình dữ liệu

- **Trạng thái:** Đã xác nhận.
- **Bối cảnh:** Workbook hiện tại có tên/sheet Đại học, Cao đẳng vì quy trình cũ tách file theo khối.
- **Quyết định:** Khi chuyển đổi dữ liệu, phạm vi Đại học/Cao đẳng của workbook này được dùng làm giá trị nháp có nguồn. Admin có thể bổ sung hoặc bỏ khối trước khi rà soát; bản ban hành mới có hiệu lực.
- **Hệ quả:** Web giữ một danh mục hạng mục chuẩn và sinh phạm vi theo snapshot, thay cho bốn file Excel độc lập.

## D-2026-08-13-04 — Một phân hệ Đơn vị, phạm vi theo tổ chức và khối

- **Trạng thái:** Đã xác nhận cho vertical slice local.
- **Quyết định:** Bốn khối không tạo thành bốn vai trò hay bốn ứng dụng. Tài khoản đơn vị dùng chung một phân hệ và cùng năng lực nghiệp vụ; tổ chức mà tài khoản thuộc về quyết định `unitBlockId` và phạm vi dữ liệu.
- **Hệ quả giao diện:** Mọi đơn vị dùng cùng route, điều hướng và mẫu nhập. Danh sách `Công việc được giao` thay đổi theo khối của tổ chức.
- **Hệ quả bảo mật:** Bản thật lấy tổ chức từ phiên đăng nhập và lọc ở server. Bộ chọn tài khoản hiện tại chỉ là công cụ duyệt UX local, không được đưa vào UI vận hành.

## D-2026-08-13-05 — Đơn vị chỉ nhận phạm vi Admin đã lưu/ban hành

- **Trạng thái:** Đã xác nhận cho prototype; bước ban hành thật vẫn bị khóa.
- **Quyết định:** Không tự suy diễn hạng mục của ba khối còn lại từ workbook ĐH/CĐ. Prototype đọc đúng bản nháp `Khối áp dụng` mà Admin lưu trong cùng phiên; nếu chưa có, chỉ khối ĐH/CĐ nhận 27 hạng mục từ nguồn và ba khối còn lại ở trạng thái chưa được giao.
- **Hệ quả vận hành:** Sau này workspace Đơn vị chỉ đọc snapshot đã ban hành, không đọc bản nháp đang chỉnh của Admin. Snapshot giữ nguyên mã hạng mục, yêu cầu, điểm tối đa, khối áp dụng và phiên bản nguồn.

## D-2026-08-13-06 — Tổ theo dõi định tuyến, Phụ trách sở hữu quyết định

- **Trạng thái:** Quyền SubAdmin1 đã được xác nhận và chốt tại D-41; cơ chế người thay thế vẫn cần khách hàng xác nhận.
- **Quyết định:** `Tổ theo dõi` đưa case vào phạm vi chuyên môn của Tổ; `Phụ trách` là cán bộ xử lý chính được ghi quyết định trên dòng. Một assignment trên tiêu chí sinh nhiều review case theo các đơn vị đã gửi.
- **Hệ quả:** Hàng chờ không lọc chỉ theo khối hoặc tên workbook. Quyền ghi phải khớp assignment snapshot và đơn vị/campaign của case.

## D-2026-08-13-07 — Subadmin Tổ không kế thừa quyền Admin hệ thống

- **Trạng thái:** Đã áp dụng cho vertical slice local.
- **Quyết định:** Người của Tổ chỉ đọc hồ sơ/minh chứng trong phạm vi được giao và ghi điểm/lý do thẩm định. Họ không được sửa bảng tiêu chí, phân khối, tài khoản, snapshot hoặc dữ liệu tự chấm gốc.
- **Hệ quả:** Dùng shell và route riêng `/reviewer/queue`; server về sau deny-by-default theo team/officer assignment. Tên gọi “subadmin” chỉ mô tả mức trách nhiệm nghiệp vụ, không phải role Admin tổng quát.

## D-2026-08-13-08 — Hàng chờ thẩm định dùng ngữ cảnh Campaign → Hạng mục → Đơn vị

- **Trạng thái:** Đã áp dụng cho vertical slice local.
- **Quyết định:** Người chấm chọn một chiến dịch, sau đó tập trung vào một hạng mục được giao; bảng bên dưới liệt kê các đơn vị đã gửi hồ sơ cho hạng mục đó. Không trộn mọi chiến dịch và hạng mục vào một bảng phẳng mặc định.
- **Lý do:** Cán bộ chuyên môn cần dùng cùng một nguyên tắc để đối chiếu nhiều đơn vị. Nhóm theo hạng mục giảm việc đọc lặp nội dung và giảm chuyển đổi tiêu chuẩn chấm trong đầu.
- **Hệ quả dữ liệu:** `ReviewCase` và `ReviewDecision` phải thuộc đúng campaign/snapshot; cùng một đơn vị và mã hạng mục ở hai chiến dịch là hai case độc lập.

## D-2026-08-14-09 — Kết quả gửi Admin theo gói hạng mục

- **Trạng thái:** Đã áp dụng cho vertical slice local.
- **Quyết định:** Bản nháp và thay đổi từng ô không được hiển thị phía Admin. Cán bộ chỉ gửi sau khi mọi ReviewCase của một hạng mục đã hoàn tất; hệ thống tạo một ReviewResultBatch chỉ-đọc.
- **Hệ quả giao diện:** Admin xem một dòng tổng hợp cho mỗi hạng mục/cán bộ và mở bảng chi tiết theo đơn vị. Không nhân toàn bộ hồ sơ con vào bảng tổng mặc định.
- **Hệ quả dữ liệu:** Cùng định danh campaign, scorecard version, criterion, reviewer và round chỉ sinh một gói. Sửa sau gửi phải tạo transition/revision có audit, không cập nhật đè.

## D-2026-08-14-10 — Kết quả thẩm định trở về đúng dòng bảng điểm Admin

- **Trạng thái:** Đã áp dụng cho vertical slice local; thay thế đề xuất dùng màn kết quả tách rời làm ngữ cảnh chính.
- **Quyết định:** Admin xem kết quả trong chế độ `Kết quả thẩm định` của chính `/admin/scorecard-templates`. Mỗi `ReviewResultBatch` được ghép bằng `scorecardVersionId + criterionId` về đúng dòng bảng điểm. Admin không phải rời bảng điểm để hiểu I.01 đã nhận gì trong khi I.02 còn thiếu gì.
- **Hệ quả giao diện:** Bảng chính chỉ giữ Mã, Hạng mục, Điểm tối đa, tổng Tự chấm, tổng Được chấm, Chênh lệch và Kết quả. Tổ/người gửi nằm trong ô Kết quả; hồ sơ đơn vị mở inline theo nhu cầu. Không nhân bốn hồ sơ con vào mặt bảng mặc định.
- **Hệ quả quyền và dữ liệu:** Dữ liệu vẫn là snapshot chỉ-đọc đã gửi từ Tổ; hợp nhất vị trí hiển thị không trao cho Admin quyền sửa âm thầm điểm hoặc bản gốc. Route `/admin/review-results` tạm giữ làm màn đối chiếu phụ trong prototype local.

## D-2026-08-14-11 — Nguồn gốc quyết định phải đọc được ngay trên dòng kết quả

- **Trạng thái:** Đã áp dụng cho vertical slice local.
- **Quyết định:** Một dòng đã nhận kết quả phải chỉ rõ đồng thời mã dòng được cập nhật, tổng điểm trước–sau, cán bộ chấm, Tổ chuyên môn, số hồ sơ và thời điểm nhận. Mở chi tiết phải lặp lại nguồn gốc snapshot và phân biệt rõ hồ sơ bị điều chỉnh với hồ sơ giữ nguyên.
- **Hệ quả giao diện:** Bảng tổng hợp nhóm thành `Kết quả điểm`, `Người chấm`, `Cập nhật`; dòng đã nhận có nhãn `Đã cập nhật`. Chi tiết có dải `Người chấm / Tổ chuyên môn / Nhận lúc / Phạm vi`; chỉ dòng có chênh lệch dùng nền cảnh báo nhẹ.
- **Giới hạn ngữ nghĩa:** `submittedAt` là thời điểm bàn giao gói, không phải “lần sửa cuối”. Lịch sử revision, người sửa và hành động trả lại chỉ được hiển thị sau khi backend lưu AuditRecord thật.

## D-2026-08-14-12 — Superadmin hệ thống tách khỏi nhiều Admin chiến dịch

- **Trạng thái:** Đã áp dụng cho information architecture và vertical slice local.
- **Quyết định:** `Superadmin hệ thống` quản trị nền tảng/toàn hệ thống; `Admin chiến dịch` là grant nhiều–nhiều giữa tài khoản và chiến dịch. Một chiến dịch có thể có nhiều Admin, một Admin có thể được giao nhiều chiến dịch.
- **Hệ quả giao diện:** Dùng hai không gian `/superadmin` và `/admin` với sidebar, danh tính và scope khác nhau. Admin chiến dịch không nhìn thấy Tài khoản toàn cục, Tích hợp, Nhật ký bảo mật hoặc Sao lưu. Superadmin không mặc nhiên có công cụ sửa điểm/chấm hồ sơ trong sidebar.
- **Hệ quả dữ liệu:** Không lưu một `adminId` duy nhất trên Campaign. Dùng `CampaignAdminGrant` và capability riêng cho ban hành, mở lại hoặc override. Mọi write giữ đúng actor, version và AuditRecord.
- **Giới hạn prototype:** Tách route/sidebar local chỉ kiểm chứng IA; server authorization deny-by-default mới là hàng rào bảo mật thật.

## D-2026-08-14-13 — Kết quả cuối tổng hợp theo đơn vị nhưng truy ngược được về hạng mục

- **Trạng thái:** Đã áp dụng cho vertical slice local bằng dữ liệu giả định.
- **Quyết định:** Giữ `Kết quả thẩm định` làm góc nhìn theo hạng mục/Tổ và bổ sung `Kết quả cuối` làm góc nhìn theo đơn vị trong cùng workbench. Tổng đơn vị phải được tái tạo từ các ReviewResultLine, áp trần thưởng 25 rồi chia cho 83 theo workbook.
- **Hệ quả giao diện:** Bảng tổng hợp hiển thị tự chấm, cơ bản, thưởng thô → áp dụng, tổng, tỷ lệ và xếp loại; mở dòng cho thấy công thức và provenance. Có đường chuyển trực tiếp về 55 dòng chấm để đối chiếu.
- **Giới hạn ngữ nghĩa:** Cột thứ tự chỉ phục vụ đối soát. Chưa gọi là bảng xếp hạng/công bố khi chưa có quy tắc đồng hạng, quyền duyệt, khóa giải trình và snapshot bất biến.
- **Fixture kiểm chứng:** 16 đơn vị × 55 dòng = 880 kết quả; dữ liệu luôn gắn nhãn giả định và không được nhầm với dữ liệu khách hàng.

## D-2026-08-14-14 — Vòng đời tách thành bốn state machine liên kết

- **Trạng thái:** Baseline để triển khai walking skeleton local; cần khách hàng ký trước pilot.
- **Quyết định:** Không dùng một trạng thái chung cho toàn hệ thống. Tách `CampaignPhase`, `SubmissionStatus`, `ReviewCaseStatus` và `FinalResultStatus`; transition được thực hiện bằng command có điều kiện, không cập nhật chuỗi trạng thái tùy ý.
- **Hệ quả:** Một hồ sơ bị trả không làm cả chiến dịch quay ngược giai đoạn. Vòng 1, giải trình và vòng 2 là các revision bất biến; kết quả hiệu lực vẫn truy được nguồn.
- **Đặc tả:** `ba/13_WORK_LIFECYCLE.md`.

## D-2026-08-14-15 — Kết quả cuối dùng cơ chế bốn mắt

- **Trạng thái:** Mặc định bảo thủ cho local; cần xác nhận người/capability chính thức.
- **Quyết định:** `result.prepare` và `result.approve` phải do hai tài khoản Admin chiến dịch khác nhau thực hiện. `campaign.publish` là capability riêng; Superadmin không mặc nhiên có quyền này.
- **Hệ quả:** Backend từ chối tự duyệt dù actor mang nhãn Admin. UI duyệt hiển thị người lập, version, checksum và phạm vi trước khi xác nhận.

## D-2026-08-14-16 — Mở lại tạo revision, không mở khóa bản đã nộp

- **Trạng thái:** Baseline local.
- **Quyết định:** Trả/mở lại hồ sơ hoặc quyết định đã gửi luôn yêu cầu lý do và tạo revision mới. Revision cũ giữ nguyên, case/gói mới chỉ rõ bản bị thay thế.
- **Hệ quả:** Không có thao tác sửa trực tiếp dữ liệu lịch sử. Business write và AuditRecord nằm cùng transaction; command quan trọng có idempotency key và optimistic version.

## D-2026-08-14-17 — Vòng 2 chỉ thay thế điểm hiệu lực của dòng đã xử lý

- **Trạng thái:** Mặc định bảo thủ cho local; cần golden case khách hàng xác nhận.
- **Quyết định:** Nếu có `ReviewDecision(round=2)`, điểm đó là điểm cuối của dòng; nếu không, giữ điểm vòng 1. Quyết định vòng 2 không ghi đè vòng 1.
- **Hệ quả:** Kết quả cuối tái dựng được theo từng line và giải thích được chênh lệch qua các vòng.

## D-2026-08-14-18 — Superadmin giám sát projection vận hành đã lược dữ liệu

- **Trạng thái:** Đã áp dụng cho walking skeleton local.
- **Quyết định:** Superadmin được đọc trạng thái dịch vụ, phase chiến dịch, trạng thái các chặng và nhịp audit gần nhất; không được dùng endpoint campaign để đọc điểm, minh chứng, nhận xét hoặc danh tính người thao tác.
- **Hệ quả quyền:** `platform.manage` không bao hàm capability nghiệp vụ. API campaign tiếp tục từ chối Superadmin nếu không có grant chiến dịch riêng; màn giám sát không có command chuyển trạng thái.
- **Hệ quả UX:** `/superadmin/lifecycle` trình bày tín hiệu theo chặng và tuyên bố rõ ranh giới “chỉ giám sát, không can thiệp”.

## D-2026-08-14-19 — Trả hồ sơ giữ bản nộp cũ và tái sử dụng ReviewCase

- **Trạng thái:** Đã áp dụng cho walking skeleton I.01 trước vòng 1.
- **Quyết định:** Admin có `submission.return` chỉ được trả hồ sơ khi chiến dịch còn `SELF_ASSESSMENT`, hồ sơ đã nộp và case còn `QUEUED`. Lý do là bắt buộc. `SubmissionRevision` đã nộp không bị sửa; trạng thái hiện hành sang `RETURNED`, case về `WAITING_FOR_SUBMISSION` và lần gửi tiếp theo tạo revision mới ở `RESUBMITTED`.
- **Hệ quả dữ liệu:** Không sinh case song song cho cùng dòng trong lát cắt; case hiện tại được xếp hàng lại và mọi transition chia sẻ correlation ID trong audit. Khi cần nhiều assignment/version đồng thời mới tách case mới.
- **Hệ quả UX:** Admin thấy “Mở vòng 1” là hành động chính và “Trả hồ sơ” là ngoại lệ có lý do. Đơn vị nhận banner lý do, sửa điểm/link/tóm tắt rồi gửi lại; số bản tăng rõ ràng.

## D-2026-08-14-20 — Superadmin có toàn bộ capability nhưng không phá bất biến

- **Trạng thái:** Quyết định mới của chủ dự án; thay thế phần giới hạn quyền tại D-12, D-15 và toàn bộ D-18.
- **Quyết định:** Superadmin được đọc và thực hiện mọi use case đã triển khai trên mọi campaign, đơn vị, tổ và assignment. Quyền này được suy ra tại backend; không phải impersonation hoặc đổi vai trên trình duyệt.
- **Giới hạn bắt buộc:** “Toàn quyền” không đồng nghĩa với bỏ audit, optimistic version, snapshot bất biến hoặc nguyên tắc bốn mắt. Nếu cùng một Superadmin đã lập kết quả thì một tài khoản khác vẫn phải duyệt; hệ thống không cho một danh tính tự duyệt.
- **Hệ quả UX:** Superadmin có thể vào mọi workspace qua menu tài khoản. Admin, Reviewer và Unit vẫn chỉ thấy phạm vi của mình.

## D-2026-08-14-21 — Runtime không chứa mock; seed chỉ chứa dữ liệu có nguồn

- **Trạng thái:** Đã áp dụng local ngày 14/08/2026.
- **Quyết định:** Xóa actor selector, header `X-Actor-Id`, endpoint walking-skeleton, mọi trang/fixture giả và dữ liệu điểm/minh chứng/kết quả mẫu khỏi runtime. Test fixture chỉ được tồn tại trong test scope.
- **Seed hợp lệ:** campaign, 4 khối/134 đơn vị tổng hợp và 27 hạng mục/55 dòng chấm lấy từ PDF/workbook, kèm SHA-256 `8D29…1653`. Không seed tên cán bộ, tài khoản cá nhân, đơn vị cụ thể, điểm tự chấm, link minh chứng hoặc kết quả khi không có nguồn.
- **Khởi tạo truy cập:** `scripts/dev.ps1` sinh mật khẩu ngẫu nhiên cho tài khoản kỹ thuật `superadmin`, lưu ngoài source tại `.tmp/local-superadmin.password`; Superadmin tạo các tài khoản vận hành thật sau khi khách hàng cung cấp danh tính.

## D-2026-08-14-22 — Đổi mật khẩu lần đầu là điều kiện ở backend

- **Quyết định:** Mọi tài khoản do Superadmin tạo mang cờ `password_change_required`. Sau khi đăng nhập, backend chỉ cho phép các endpoint xác thực cho tới khi mật khẩu khởi tạo được đổi; request nghiệp vụ nhận `428 PASSWORD_CHANGE_REQUIRED`.
- **Hệ quả UX:** Router đưa người dùng tới trang `/change-password`; điều hướng frontend chỉ hỗ trợ trải nghiệm, không thay thế kiểm tra tại server.
- **Kiểm chứng:** Integration test chứng minh tài khoản mới không đọc được scorecard trước khi đổi mật khẩu và đọc được ngay sau giao dịch đổi mật khẩu thành công.

## D-2026-08-14-23 — Local runtime có persistence, test vẫn cô lập

- **Quyết định:** `scripts/dev.ps1` bật Spring profile `local` và dùng H2 file tại `.tmp/campaign-local.mv.db`. Cấu hình mặc định của test giữ H2 in-memory để mỗi lần `mvn clean test` bắt đầu từ schema rỗng.
- **Lý do:** Tài khoản, audit và dữ liệu vận hành do người dùng nhập phải tồn tại qua restart; file database local không phải dữ liệu seed và không được đưa vào source control.

## D-2026-08-14-24 — Danh mục tổ chức do Superadmin xác nhận, không seed tên giả

- **Quyết định:** Bốn khối và số lượng 134 đơn vị tiếp tục là dữ liệu tham chiếu có nguồn. Tên đơn vị và tổ theo dõi khởi tạo rỗng; Superadmin nhập qua module Cơ cấu tổ chức, mỗi write đi cùng audit.
- **Ràng buộc:** Tài khoản `UNIT_MEMBER` phải tham chiếu một đơn vị đang hoạt động; `REVIEWER` phải tham chiếu một tổ theo dõi đang hoạt động. Frontend chỉ cho chọn từ dropdown, backend và foreign key kiểm tra lại.
- **Hệ quả:** Có thể onboarding dữ liệu thật từng bước mà không cần nhét danh tính hoặc tên tổ giả vào seed.

## D-2026-08-14-25 — Snapshot phân công ở cấp hạng mục sinh công việc theo dòng chấm

- **Trạng thái:** Đã hiện thực và kiểm chứng full-stack local ngày 14/08/2026.
- **Quyết định:** Admin lưu `AssignmentPlan(campaign, hạng mục, Tổ, Phụ trách)` và tập `Applicability(hạng mục, khối)`. Khi ban hành, mỗi đơn vị đang hoạt động thuộc khối áp dụng nhận các dòng chấm con; không nhân bản nội dung bảng điểm.
- **Điều kiện ban hành:** 27/27 hạng mục phải có ít nhất một khối, một Tổ và một Reviewer đang hoạt động thuộc đúng Tổ. Snapshot đã ban hành không sửa tại chỗ.
- **Phạm vi server:** Unit task được suy ra từ organization trong session; review case ghi cố định Tổ/Reviewer của snapshot lúc đơn vị gửi. Biết ID không giúp tài khoản ngoài scope đọc hoặc ghi.
- **Hệ quả UX:** Bảng là vùng tập trung; chọn một hoặc nhiều hạng mục rồi cấu hình trong inspector bên phải. Bảng Admin nhận tiến độ và provenance người chấm trực tiếp, không cần một màn kết quả rời để biết dòng nào vừa cập nhật.

## D-2026-08-14-26 — Quét image và quét SBOM Java là hai cổng độc lập

- **Trạng thái:** Đã áp dụng cho CI và production-like local ngày 14/08/2026.
- **Quyết định:** Image scan tiếp tục chặn HIGH/CRITICAL có bản vá ở lớp hệ điều hành. Build Maven đồng thời sinh CycloneDX SBOM do Spring Boot quản lý; CI quét SBOM này bằng một bước riêng để không bỏ sót dependency nằm trong executable JAR.
- **Lý do:** Kết quả image scan có thể báo sạch lớp Alpine nhưng không nhận diện package Java trong fat JAR. Một cổng xanh như vậy không đủ chứng minh chuỗi cung ứng backend.
- **Hệ quả:** `mvn verify` vừa chạy test vừa tạo `target/classes/META-INF/sbom/application.cdx.json`; pull request thất bại nếu SBOM có HIGH/CRITICAL fixable. Không thêm một hệ thống supply-chain riêng khi chuẩn Maven/Spring hiện tại đã đủ cho vertical slice.

## D-2026-08-15-27 — [Đã thay thế] Tên sản phẩm local là Dấu Xanh Hải Phòng

- **Trạng thái:** Chủ dự án đã duyệt ngày 15/08/2026; áp dụng cho bề mặt người dùng local.
- **Quyết định:** Tên sản phẩm là **Dấu Xanh Hải Phòng**, tên rút gọn **Dấu Xanh**, mô tả **Nền tảng điều hành chiến dịch thanh niên** và chủ thể vận hành **Thành đoàn Hải Phòng**.
- **Đã thay thế bởi:** D-2026-08-20-29.
- **Nhận diện:** Biểu tượng SVG hai màu kết hợp dấu xác nhận, đường công việc và gợi ý tuyến/sóng cảng. Không biến thể hoặc trộn với biểu trưng chính thức của Đoàn; ảnh imagegen chỉ là artifact duyệt hướng.
- **Ranh giới kỹ thuật:** Chỉ đổi bề mặt sản phẩm, metadata và tên ứng dụng trong export. Giữ package, module, database và API identifier ổn định để tránh migration không tạo giá trị nghiệp vụ.
- **Ranh giới SEO:** Toàn bộ ứng dụng có đăng nhập tiếp tục `noindex, nofollow`. Website công khai và kiểm tra nhãn hiệu/tên miền là cổng riêng trước khi xuất bản; không có deploy trong quyết định này.

## D-2026-08-15-28 — UX dùng lưới 4 px, typography floor 12 px và hierarchy theo nhiệm vụ

- **Trạng thái:** Đã áp dụng local ngày 15/08/2026.
- **Quyết định:** Login dùng lưới bất đối xứng 1,15:0,85 trong khung tối đa 1040 px và về một cột dưới 760 px. Trang nội dung dùng inset `clamp(20px, 2.5vw, 40px)`; workbench giữ mật độ riêng nhưng chữ không dưới 12 px, control không dưới 40 px.
- **Hierarchy:** Sáu KPI vòng đời được gom thành ba nhóm có ngữ nghĩa. Navigation active dùng vạch 3 × 24 px ngoài màu/nền. Eyebrow chuyển sang sentence case, metadata không dùng pill.
- **Ranh giới mobile:** Bảng nhiều cột tiếp tục cuộn trong container để giữ quan hệ Excel; không chuyển thành card làm mất phép so sánh cột. Luồng nhập/chấm đầy đủ ưu tiên tablet/desktop, nhưng route mobile không được tràn document hoặc mất khả năng truy cập.
- **Bằng chứng:** regression browser trong `../app/frontend/e2e/`; ảnh chạy thử là đầu ra tạm thời và không lưu trong Git.

## D-2026-08-20-29 — Đổi tên sản phẩm thành Neko Đoàn

- **Trạng thái:** Chủ dự án đã chốt ngày 20/08/2026; thay thế D-2026-08-15-27.
- **Quyết định:** Tên sản phẩm và tên rút gọn thống nhất là **Neko Đoàn**. **Thành đoàn Hải Phòng** tiếp tục là chủ thể vận hành, hiển thị ở lớp ngữ cảnh riêng.
- **Phạm vi kỹ thuật:** Đổi runtime title, metadata, tên artifact frontend/backend, Compose project, image tag, export metadata và tài liệu hiện hành. Giữ package Java, route API, campaign ID và migration đã phát hành để tránh thay đổi dữ liệu không tạo giá trị.
- **Tài sản:** Tạm giữ hình học vector đã duyệt dưới tên tài sản mới. Thiết kế lại biểu tượng là quyết định nhận diện riêng, không chặn cải tạo kiến trúc.
- **Ranh giới:** Ứng dụng nội bộ tiếp tục `noindex, nofollow`; không deploy trong thay đổi này.

## D-2026-08-20-30 — Port sở hữu projection, OpenAPI sở hữu DTO biên

- **Trạng thái:** Đã áp dụng và khóa bằng test ngày 20/08/2026.
- **Quyết định backend:** Application service chỉ phụ thuộc port theo use case. Adapter SQL trả record projection do port sở hữu; adapter không import hoặc dựng `*View`. View được ánh xạ tại application boundary, domain tiếp tục không biết Spring/JDBC/HTTP.
- **Quyết định frontend:** `app/contracts/openapi.yaml` là nguồn DTO biên duy nhất. TypeScript được sinh vào thư mục `api/generated`; page/service chỉ dùng alias mỏng trong `api/models.ts`. Không duy trì interface response thủ công song song.
- **Gate:** Architecture test chặn application → infrastructure/web và infrastructure → view model. Contract check chặn OpenAPI sai chuẩn hoặc generated DTO drift.
- **Hiệu năng đi kèm:** Session authentication được gom còn một query; sau final snapshot, progress dùng số dòng snapshot bất biến thay vì đếm lại submission/review. Baseline 134 × 55 giảm p95 từ 2.179,03 ms xuống 21,78 ms mà không nới budget.

## D-2026-08-20-31 — Neko Peek là biểu tượng Neko Đoàn; SEO nội bộ là chống index

- **Trạng thái:** Đã áp dụng local ngày 20/08/2026; hoàn tất phần “thiết kế lại biểu tượng” còn mở tại D-29.
- **Quyết định nhận diện:** Neko Đoàn kế thừa Neko Peek chuẩn của Neko Family v1. Không tạo mascot/pose thứ năm, không tô Neko theo vai trò và không dùng biểu tượng Đoàn chính thức. Concept imagegen chỉ thử tín hiệu Sky; SVG phát hành giữ nguyên silhouette Neko và chiếc đuôi sở hữu được.
- **Chuỗi tài sản:** Nguồn tự chứa, concept, prompt, preview và SHA-256 manifest nằm tại `docs/assets/brand/neko-doan-v1/`; runtime chỉ nhận derivative đã chọn qua script đồng bộ. Gate Node chặn asset drift, sai kích thước, robots/manifest/metadata thiếu hoặc canonical/schema public giả.
- **Quyết định SEO:** Ứng dụng có đăng nhập tiếp tục `noindex, nofollow, noarchive, nosnippet, noimageindex`, thêm `robots.txt` và `X-Robots-Tag`. Không tạo sitemap, canonical hay JSON-LD khi chưa có website/tên miền public; Open Graph/Twitter chỉ chuẩn bị nhận diện nội bộ bằng social card 1200×630.
- **Hệ quả:** Khi có lớp public, phải quyết định origin tuyệt đối và nội dung hiển thị trước khi thêm `WebSite`, `Organization`, `SoftwareApplication`, canonical hoặc sitemap. Không suy diễn dữ liệu pháp lý, rating, giá hay URL.

## D-2026-08-20-32 — Đăng nhập identifier-first không dò tồn tại tài khoản

- **Trạng thái:** Đã áp dụng và kiểm chứng local ngày 20/08/2026.
- **Quyết định UX:** `/login` là một luồng hai trạng thái trên cùng URL. Trạng thái đầu chỉ yêu cầu tên đăng nhập; trạng thái sau giữ tên đăng nhập ở trường chỉ đọc, cho phép sửa và mới hiển thị mật khẩu. Mỗi trạng thái có đúng một hành động chính; focus được chuyển có chủ đích và toàn bộ luồng dùng được bằng bàn phím, password manager và paste.
- **Quyết định bảo mật:** “Tiếp tục” chỉ đổi trạng thái trong trình duyệt, không gọi endpoint dò tài khoản. Chỉ biểu mẫu đầy đủ mới gọi `/api/auth/login`; lỗi tiếp tục là thông báo chung cho tài khoản không tồn tại, sai mật khẩu hoặc tài khoản bị vô hiệu hóa. Backend giữ dummy hash, thay session, audit và rate limit tại reverse proxy.
- **Ranh giới sản phẩm:** Không dựng giả đăng ký, quên mật khẩu, ngôn ngữ hoặc liên kết pháp lý khi chưa có use case/route được duyệt. Cổng nội bộ chỉ hướng người dùng liên hệ quản trị viên đơn vị.
- **Bằng chứng:** Unit test khóa “không request ở bước tài khoản”; browser regression khóa focus, sửa tài khoản, hiện/ẩn mật khẩu, lỗi chung, desktop 1512×982, tablet 1024×768, mobile 390×844 và axe WCAG 2.2 AA.

## D-2026-08-20-33 — Quay lại là hành động phụ đầy đủ ở bước mật khẩu

- **Trạng thái:** Chủ dự án chốt ngày 20/08/2026; áp dụng local.
- **Quyết định:** Bước mật khẩu giữ một nút phụ toàn chiều rộng mang nhãn `Quay lại`, không dùng ký hiệu `←`. Nút `Sửa` trong trường tài khoản và nút `Quay lại` cùng trở về bước định danh, giữ tên đăng nhập và xóa mật khẩu/lỗi cũ.
- **Phân cấp:** `Đăng nhập` là hành động chính duy nhất với nền Cocoa; `Quay lại` dùng nền trắng và viền trung tính. Quyết định này chủ ý thay thế khuyến nghị chỉ dùng liên kết sửa tài khoản vì chủ dự án ưu tiên đích bấm lớn, quen thuộc và rõ ràng.
- **Tỷ lệ đi kèm:** Authentication dùng toàn viewport, không khung lớn; cột tác vụ 448 px, input 52 px, button 50 px và tâm thị giác cao hơn tâm hình học.
- **Bằng chứng:** Unit test khóa nhãn/không có mũi tên/hành vi quay lại; browser regression khóa desktop 1512×982, source viewport 1448×1086, tablet, mobile, axe và toàn luồng đăng nhập.

## D-2026-08-20-34 — Icon thao tác trung tính; Neko chỉ sở hữu lớp nhận diện

- **Trạng thái:** Đã áp dụng và kiểm chứng local ngày 20/08/2026.
- **Quyết định:** Trường tài khoản và mật khẩu dùng tập con **Neko Interface Icons v1**, nhập nguyên bản ba SVG `pencil-simple`, `eye`, `eye-slash` từ Phosphor Regular 2.1.1. Không tự biến đầu, tai, đuôi hoặc pose Neko thành icon sửa/hiện/ẩn vì thao tác cần được nhận ra ngay trước khi cần tạo cá tính.
- **Lý do chọn:** Phosphor có silhouette mắt và bút chì quy ước, đầu nét bo, rõ ở 20 px và gần ngôn ngữ hình học của concept đã duyệt. Iconoir từng được thử nhưng glyph mắt tạo cảm giác cung/radio ở kích thước thật nên bị loại sau visual QA.
- **Quy tắc:** Glyph 20 px nằm trong đích bấm 48 × 48 px; trạng thái ẩn dùng `eye`, trạng thái hiện dùng `eye-slash`; mọi icon-only button phải có accessible name và tooltip tiếng Việt. Không trộn một họ icon khác trong cùng control group.
- **Chuỗi cung ứng:** Manifest khóa version, package integrity, byte count và SHA-256; license MIT được lưu cùng canonical/runtime assets; brand gate chặn drift giữa `docs/assets/icons/neko-interface-v1/` và `app/frontend/public/icons/neko-interface-v1/`.
- **Bằng chứng:** Unit test khóa nhãn, không có text node, source SVG và state transition; browser regression khóa hành vi và axe; ảnh đối chiếu source/implementation được lưu trong artifact local.

## D-2026-08-20-35 — Chốt identity-access ở mức local/UAT, không gắn nhãn production giả

- **Trạng thái:** Chủ dự án chấp thuận đóng màn login; phạm vi kỹ thuật được chốt ngày 20/08/2026.
- **Quyết định:** Luồng identifier-first, password-session, CSRF, đổi mật khẩu lần đầu, logout và role routing trở thành baseline ổn định của `identity-access`. Thay đổi tiếp theo cần use case/threat model mới và phải cập nhật `modules/IDENTITY_ACCESS.md` cùng regression.
- **Quy tắc token:** Sau khi login thay anonymous session, frontend bắt buộc lấy CSRF token mới trước authenticated write đầu tiên; unit test và role smoke khóa hồi quy này.
- **Ranh giới:** “Chốt” chỉ có nghĩa local/UAT. Không tuyên bố production authentication hoàn chỉnh khi chưa quyết định IdP/MFA, recovery, password breach blocklist, throttling theo account và thu hồi phiên tập trung.
- **Dữ liệu kiểm định:** Tài khoản `uat.*` và cơ cấu `LAB-*` chỉ được provision bằng script local, không nằm trong migration/seed và không đại diện dữ liệu khách hàng. Secret chỉ nằm trong `.tmp/` bị Git bỏ qua.
- **Hệ quả sản phẩm:** Không tiếp tục thay đổi `/login` vì sở thích hình thức. Phân hệ kế tiếp để đánh giá là `scorecard-assignment`; các workspace Admin/Reviewer/Unit có tài khoản local riêng để chủ dự án duyệt từng luồng.

## D-2026-08-20-36 — Giữ mật khẩu trong biểu mẫu sau lỗi xác thực

- **Trạng thái:** Chủ dự án yêu cầu và chốt ngày 20/08/2026; regression đã cập nhật.
- **Quyết định:** Khi backend từ chối đăng nhập, thông báo vẫn là lỗi chung nhưng giá trị mật khẩu được giữ để người dùng sửa và thử lại; trường được chuyển về `type=password` và nhận focus.
- **Ranh giới bảo mật:** Giá trị chỉ tồn tại trong state sống của component, không ghi vào web storage, URL, log hoặc tài liệu. Chọn `Sửa`, `Quay lại`, tải lại hoặc rời trang vẫn xóa state mật khẩu.
- **Bằng chứng:** Unit test và browser smoke khóa đồng thời thông báo chung, giá trị được giữ, trạng thái che và focus.

## D-2026-08-20-37 — Một codebase, hai chế độ local có ranh giới rõ

- **Trạng thái:** Đã rà soát và chốt ngày 20/08/2026 sau sự cố dùng nhầm mật khẩu.
- **Quyết định:** Không xóa `4317` hoặc `4319`. `4317` là vòng lặp developer có hot reload/H2; `4319` là harness release-candidate dùng production build/PostgreSQL/TLS. Chúng không phải hai bản sản phẩm cho người dùng lựa chọn.
- **Chống nhầm lẫn:** Login gắn nhãn `Bản phát triển` trên `4317`, `Kiểm định TLS` trên `4319`, còn deploy thật giữ `Cổng nội bộ`. Script và runbook nêu rõ mục đích cùng nguồn credential.
- **Ranh giới:** Chủ dự án dùng `4317` khi duyệt thay đổi UX cùng developer; UAT/release evidence chỉ lấy từ `4319` hoặc staging thật. Không dùng dữ liệu hay secret chéo giữa hai chế độ.

## D-2026-08-21-38 — Bảng Tổng là nguồn chuẩn; phân bổ và phân công là hành động theo lựa chọn

- **Trạng thái:** Đã áp dụng local ngày 21/08/2026 theo bản phân tích và visual target do chủ dự án cung cấp; chờ chủ dự án xác nhận để chốt UX local/UAT.
- **Quyết định nghiệp vụ:** Admin chiến dịch bắt đầu từ một **Bảng Tổng** gồm 27 tiêu chí nghiệp vụ và 55 dòng chấm. Từ đây Admin chọn tiêu chí để phân bổ phạm vi áp dụng và phân công người chấm; không nhân bản catalog thành bốn bảng nguồn độc lập.
- **Quyết định điều hướng:** Sidebar Admin chiến dịch giữ `Tổng quan`, `Bảng Tổng`, `Phiên bản`, `Kết quả & đối soát` và projection chỉ đọc `Tổ & cán bộ`. `Phân bổ` và `Phân công` chỉ xuất hiện sau selection vì là command trên tiêu chí, không phải destination.
- **Quyết định dữ liệu:** Metadata phân biệt rõ 27 tiêu chí với 55 dòng tính điểm. Tab lọc đếm số tiêu chí thực sự hiển thị (`27 / 22 / 5`); không sao chép số `55 / 30 / 25` mâu thuẫn trong concept. Runtime chuẩn không dựng tên Tổ, cán bộ hoặc trạng thái đã phân công giả để giống ảnh.
- **Quyết định trình bày:** Bảng dùng một dòng cho mỗi tiêu chí, ưu tiên câu chấm điểm trong phần tóm tắt và đưa chi tiết 55 dòng vào inspector. UI giữ mật độ yên tĩnh, typography 14 px cho nội dung chính, progressive disclosure và pagination 10 tiêu chí/trang.
- **Bằng chứng:** `app/frontend/e2e/role-workspaces-smoke.py` khóa năm mục điều hướng, metadata, selection, hai command độc lập, route Phiên bản/Tổ & cán bộ, axe và không tràn ngang. `design-qa.md` lưu đối chiếu cùng viewport với visual target.

## D-2026-08-21-39 — Roster khách hàng do Superadmin sở hữu; Admin chỉ phân công từ roster

- **Trạng thái:** Phần provenance/quản trị vẫn áp dụng; diễn giải quyền SubAdmin1/SubAdmin2 được D-41 thay thế ngày 21/08/2026; chưa deploy.
- **Nguồn sự thật:** Sheet `Danh sách tài khoản`, SHA-256 `8fc7c990f4aa7803b38dfbc1f9649f8a719421270f23ff9b3832ed28904c7e7a`, gồm 1 Superadmin, 4 Admin, 5 SubAdmin1, 20 SubAdmin2 và 134 tài khoản đơn vị. Năm Tổ, 134 đơn vị và 163 tài khoản tạo mới lưu đồng thời `file + hash + sheet + source row`; Superadmin bootstrap hiện hữu được đối chiếu riêng.
- **Mô hình quyền:** Không tạo role kỹ thuật `SubAdmin1/SubAdmin2`. Cả hai là `REVIEWER`; người theo dõi Tổ có capability `review.team.overview`. Người có thể được chọn chấm là bất kỳ Reviewer đang hoạt động và thuộc đúng Tổ; quyền chấm chỉ phát sinh từ assignment cụ thể.
- **Quản trị:** Superadmin tạo/khóa/mở khóa roster qua API có audit cùng transaction. Admin chiến dịch không sửa roster; workbench chỉ đọc projection gồm người theo dõi Tổ, số cán bộ chấm khả dụng và số tài khoản khóa.
- **UX phân công:** Drawer chọn Tổ trước, hiển thị người theo dõi Tổ làm ngữ cảnh rồi cho chọn `Cán bộ chấm` thuộc Tổ đó. Bộ lọc trạng thái tách `Chưa phân bổ`, `Chưa phân công`, `Đã hoàn tất`. Bulk `SCOPE` giữ nguyên người chấm; bulk `REVIEW` giữ nguyên khối áp dụng.
- **Credential:** Username là identifier vận hành ổn định, không suy diễn từ tên cá nhân; mật khẩu khởi tạo ngẫu nhiên và bắt buộc đổi lần đầu. Plaintext chỉ nằm trong manifest/sổ bàn giao dưới `.tmp/` và `outputs/`, đều bị Git bỏ qua.
- **Bằng chứng:** Provision chạy lần hai tạo mới `0/0/0` nhưng xác minh đủ `5/134/163 + 1`; login đại diện bốn luồng đạt; lock live làm Tổ TH đổi `4/0 → 3/1` và khôi phục; backend 20 test đạt, frontend 26 test đạt, hai browser smoke + axe đạt.

## D-2026-08-21-40 — Tổ & cán bộ là projection chỉ đọc của assignment

- **Trạng thái:** Điều hướng/projection vẫn áp dụng; thuật ngữ và eligibility assignment được D-41 thay thế ngày 21/08/2026; chưa deploy.
- **Quyết định điều hướng:** `Tổ & cán bộ` là destination thứ năm của Admin chiến dịch. Trang không sở hữu CRUD roster; tạo, khóa, mở khóa và thay đổi phạm vi tài khoản tiếp tục thuộc Superadmin.
- **Quyết định dữ liệu:** Trang kết hợp catalog, workbench assignment và unit-group cardinality hiện hành. Workload cán bộ bằng số assignment có `reviewerId` tương ứng; workload Tổ tính cả plan đã chọn Tổ nhưng chưa chọn cán bộ. Lượt đơn vị dự kiến là tổng số đơn vị thuộc các khối áp dụng, không phải số minh họa lưu cứng.
- **Quyết định UX:** Chế độ `Tổ chuyên môn` dùng master-detail để đọc người theo dõi Tổ, cán bộ chấm và workload; chế độ `Cán bộ` là danh sách phẳng có search. Tài khoản khóa vẫn xuất hiện để bảo toàn ngữ cảnh lịch sử nhưng không đủ điều kiện nhận phân công mới.
- **Liên kết luồng:** Drawer phân công hiển thị toàn bộ roster/workload của Tổ được chọn và có `Xem Tổ` mở `/admin/teams?team={id}`. Admin chọn được Reviewer đang hoạt động; người theo dõi Tổ là context và chỉ chấm khi được chọn trong assignment.
- **Bằng chứng:** Pure-model unit test khóa hierarchy/eligibility/workload; role smoke khóa route, query context, 5+ Tổ nguồn, 25+ cán bộ nguồn, search, read-only và axe. `design-qa.md` lưu hai artifact đối chiếu source/implementation cùng viewport.

## D-2026-08-21-41 — SubAdmin1 theo dõi Tổ; người chấm được quyết định bằng assignment

- **Trạng thái:** Đã sửa đồng bộ contract, backend, frontend, regression và tài liệu local ngày 21/08/2026; chưa deploy.
- **Nguồn nghiệp vụ:** Excel chỉ có `Tổ theo dõi` và `Phụ trách`; tài liệu bổ sung xác nhận người được giao phụ trách tiêu chí là người trực tiếp chấm. Không có bằng chứng cho một tầng approval bắt buộc trên mỗi tiêu chí.
- **Mô hình quyền:** SubAdmin1 và SubAdmin2 cùng là `REVIEWER`. Capability `review.team.overview` giúp SubAdmin1 đọc workload/tiến độ toàn `teamId`, không cho phép duyệt, sửa điểm hoặc chấm thay. Mọi quyền ghi quyết định vẫn phải khớp assignment cụ thể.
- **Mô hình dữ liệu:** `Team.monitor` tham chiếu SubAdmin1; `Team.members` chứa roster của Tổ. Criterion assignment chỉ cần `criterionId + teamId + assessorId`. Trường persistence/API lịch sử `reviewerId` hiện mang đúng nghĩa `assessorId` và không tạo approval assignment thứ hai.
- **Eligibility:** Mọi Reviewer đang hoạt động, thuộc đúng Tổ đều có thể được Admin gán trực tiếp, gồm SubAdmin1. Tài khoản khóa, sai Tổ hoặc Tổ khóa bị server từ chối.
- **UX:** Trang `Tổ & cán bộ` dùng `Theo dõi Tổ (SubAdmin1)` và `Cán bộ chấm (SubAdmin2)`. Drawer hiển thị `Người theo dõi Tổ` chỉ như context; trường command là `Cán bộ chấm`, có thể chọn SubAdmin1 hoặc SubAdmin2 đang hoạt động và luôn ghi rõ vai trò.
- **Workspace SubAdmin1:** `/reviewer/queue` trả thêm projection chỉ đọc theo Tổ khi actor có `review.team.overview`: workload từng cán bộ, số tiêu chí, hồ sơ phát sinh, chưa chấm và đã chấm. Hàng chờ ghi vẫn là `Việc tôi chấm` và tiếp tục lọc bằng `reviewer_id = actor.id`.
- **Thay thế:** D-06 không còn câu hỏi mở về quyền trưởng Tổ; các câu tại D-39/D-40 nói SubAdmin1 không được gán trực tiếp hoặc chỉ SubAdmin2 được chọn không còn hiệu lực.

## D-2026-08-21-42 — Không công bố sơ bộ; chỉ lộ dòng giảm điểm để giải trình

- **Trạng thái:** Đã áp dụng và kiểm chứng local/UAT ngày 21/08/2026; chưa deploy.
- **Quyết định:** Hành động cuối vòng 1 là `Khóa vòng 1 & mở giải trình`, không phải công bố một bảng điểm sơ bộ. Trong vòng 1, đơn vị không đọc được điểm hoặc lý do thẩm định.
- **Selective disclosure:** Khi sang `EXPLANATION`, API đơn vị chỉ lộ dòng có `điểm vòng 1 < điểm tự chấm`, kèm điểm và lý do cần đối chiếu. Dòng bằng hoặc tăng điểm vẫn ẩn, không nhận giải trình và không vào vòng 2.
- **Vòng 2:** Chỉ review case giảm điểm được chuyển `NOT_OPEN → QUEUED`. Snapshot cuối dùng điểm vòng 2 cho dòng giảm và điểm vòng 1 cho dòng bằng/tăng; metadata vòng 2 của dòng không mở được phép để trống.
- **Công bố:** Đơn vị chỉ đọc toàn bộ điểm từ snapshot bất biến sau trạng thái `PUBLISHED`. Đây là ranh giới riêng với cửa sổ giải trình có chọn lọc.
- **Bằng chứng:** `SelectiveRoundTwoApiIntegrationTest` khóa ba biên `2 < 3`, `3 = 3`, `3 > 2`; full gate đạt backend 21/21, PostgreSQL migration V1–V8, frontend 36/36 và tải 134 × 55 dưới budget.

## D-2026-08-22-43 — Đóng gói single-VPS, không tự deploy

- **Trạng thái:** Đã hiện thực gói vận hành và cổng kiểm tra; chưa chạy trên server.
- **Quyết định:** Giai đoạn đầu dùng Docker Compose trên một VPS. Chỉ Caddy mở 80/443; Angular/Nginx, Spring Boot và PostgreSQL nằm sau hai network với application network `internal`. Không thêm Kubernetes, queue, Redis hoặc microservice khi chưa có nhu cầu đo được.
- **Supply chain:** VPS không build source. PostgreSQL, Caddy, backend và frontend đều được tham chiếu bằng digest; CI tiếp tục chịu trách nhiệm test, SBOM, license và image vulnerability gate.
- **Secret/TLS:** Password đọc từ file secret ngoài repository. Caddy quản lý chứng thư và redirect HTTPS trong persistent volume; bootstrap bị từ chối trừ lần khởi tạo có cờ xác nhận.
- **Recovery:** Backup local có custom dump, checksum và Flyway metadata; restore drill chạy trên PostgreSQL cô lập. Production gate vẫn yêu cầu bản mã hóa off-host và restore từ chính bản đó.
- **Ranh giới:** Một VPS là single point of failure và backend giữ session trong bộ nhớ, nên chưa scale ngang. Khi RTO/HA yêu cầu cao hơn, ưu tiên managed PostgreSQL/backup và session store trước khi đổi orchestrator.

## D-2026-08-22-44 — Admin/Superadmin đối soát hồ sơ tại Điều hành chấm

- **Trạng thái:** Đã hiện thực contract, backend projection, frontend workbench và regression local ngày 22/08/2026; chưa deploy.
- **Quyết định điều hướng:** Superadmin dùng cùng sáu destination điều hành với Admin và thêm group `Quản trị hệ thống`. Điều này cho phép người có toàn quyền kiểm tra đúng màn nghiệp vụ thay vì chuyển qua một dashboard song song thiếu ngữ cảnh.
- **Vị trí hồ sơ:** Minh chứng đang vận hành không nằm ở `Kết quả & đối soát`. Admin/Superadmin mở `Điều hành chấm` → chọn tiêu chí → chọn đơn vị/dòng chấm. Đây là nơi duy nhất ghép submission, assignment và review history trong lúc chiến dịch đang chạy.
- **Projection:** `GET /api/admin/review-control/criteria/{groupId}/cases` dựng dữ liệu theo yêu cầu từ assignment + applicability + organization, left join submission/review case/decision/explanation. Vì vậy cả lượt chưa gửi cũng hiện rõ; không tạo bảng sao chép và không thay nguồn sự thật.

- **Provenance:** UI phân biệt `Người được giao` từ assignment với `Người chốt` từ append-only decision. Reassignment về sau không được viết lại actor lịch sử.
- **Phân quyền:** Endpoint chỉ cho `SUPERADMIN` hoặc `CAMPAIGN_ADMIN` có campaign scope. Workbench không có command chấm/sửa điểm; mọi write vẫn bắt buộc case khớp reviewer/team của phiên. Unit tiếp tục không thấy điểm vòng 1 trước cửa sổ giải trình chọn lọc.
- **Liên kết:** URL minh chứng chỉ được hiển thị thành external link `noopener noreferrer`; backend không tải nội dung URL. Việc kiểm tra độ tin cậy/tệp độc hại của nguồn ngoài vẫn là bước vận hành riêng.
- **Bằng chứng:** Workflow integration khóa ba trạng thái chưa gửi → đã gửi/chưa chấm → đã chấm, link minh chứng sau nộp lại, actor/lý do, lịch sử vòng 1–giải trình–vòng 2 và deny Unit. Frontend characterization khóa disclosure chỉ đọc và thuộc tính link an toàn.

## D-2026-08-22-45 — Superadmin không chuyển vai trong menu tài khoản

- **Trạng thái:** Đã áp dụng và khóa bằng browser regression local ngày 22/08/2026; chưa deploy.
- **Quyết định:** Superadmin làm việc trong một workspace toàn quyền, không có lựa chọn giả lập `Superadmin` hoặc `Admin chiến dịch` trong menu tài khoản. Chuyển vai không phải capability nghiệp vụ và dễ tạo kỳ vọng vượt guard hoặc làm sai danh tính audit.
- **Điều hướng:** `Điều hành chấm` vẫn là destination chính thức của Superadmin. Browser regression bắt buộc click được liên kết này khi sidebar đang ở dạng drawer 910 × 698, đóng drawer sau navigation và mở đúng `/superadmin/review-control`.
- **Menu tài khoản:** chỉ trình bày danh tính/phạm vi phiên và `Đăng xuất`. Nếu sau này cần impersonation hỗ trợ, đó phải là command riêng có lý do, thời hạn, banner cảnh báo và audit; không tái dùng menu workspace.
