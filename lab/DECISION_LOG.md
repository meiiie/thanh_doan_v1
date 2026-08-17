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

- **Trạng thái:** Tạm chốt cho prototype; cần khách hàng xác nhận quyền trưởng Tổ và người thay thế.
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

## D-2026-08-15-27 — Tên sản phẩm local là Dấu Xanh Hải Phòng

- **Trạng thái:** Chủ dự án đã duyệt ngày 15/08/2026; áp dụng cho bề mặt người dùng local.
- **Quyết định:** Tên sản phẩm là **Dấu Xanh Hải Phòng**, tên rút gọn **Dấu Xanh**, mô tả **Nền tảng điều hành chiến dịch thanh niên** và chủ thể vận hành **Thành đoàn Hải Phòng**.
- **Nhận diện:** Biểu tượng SVG hai màu kết hợp dấu xác nhận, đường công việc và gợi ý tuyến/sóng cảng. Không biến thể hoặc trộn với biểu trưng chính thức của Đoàn; ảnh imagegen chỉ là artifact duyệt hướng.
- **Ranh giới kỹ thuật:** Chỉ đổi bề mặt sản phẩm, metadata và tên ứng dụng trong export. Giữ package, module, database và API identifier ổn định để tránh migration không tạo giá trị nghiệp vụ.
- **Ranh giới SEO:** Toàn bộ ứng dụng có đăng nhập tiếp tục `noindex, nofollow`. Website công khai và kiểm tra nhãn hiệu/tên miền là cổng riêng trước khi xuất bản; không có deploy trong quyết định này.

## D-2026-08-15-28 — UX dùng lưới 4 px, typography floor 12 px và hierarchy theo nhiệm vụ

- **Trạng thái:** Đã áp dụng local ngày 15/08/2026.
- **Quyết định:** Login dùng lưới bất đối xứng 1,15:0,85 trong khung tối đa 1040 px và về một cột dưới 760 px. Trang nội dung dùng inset `clamp(20px, 2.5vw, 40px)`; workbench giữ mật độ riêng nhưng chữ không dưới 12 px, control không dưới 40 px.
- **Hierarchy:** Sáu KPI vòng đời được gom thành ba nhóm có ngữ nghĩa. Navigation active dùng vạch 3 × 24 px ngoài màu/nền. Eyebrow chuyển sang sentence case, metadata không dùng pill.
- **Ranh giới mobile:** Bảng nhiều cột tiếp tục cuộn trong container để giữ quan hệ Excel; không chuyển thành card làm mất phép so sánh cột. Luồng nhập/chấm đầy đủ ưu tiên tablet/desktop, nhưng route mobile không được tràn document hoặc mất khả năng truy cập.
- **Bằng chứng:** `audits/UX_REFINEMENT_2026-08-15.md` và ảnh Playwright trong `../app/frontend/artifacts/`.
