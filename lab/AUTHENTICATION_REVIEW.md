# Kiểm duyệt đăng nhập, phiên và đăng xuất

Cập nhật: 14/08/2026  
Phạm vi: bản local production-like trên `127.0.0.1:4318`; không phải chứng nhận an toàn thông tin hay phê duyệt triển khai Internet.

## Kết luận hiện hành

Luồng mật khẩu đơn, session phía máy chủ đã đủ chắc cho kiểm thử nghiệp vụ local: sai/không tồn tại tài khoản dùng cùng lỗi; CSRF được kiểm tra cho lệnh ghi; session fixation bị loại; cookie phiên `HttpOnly` + `SameSite=Strict`; timeout không hoạt động 30 phút; tuổi thọ tuyệt đối 12 giờ; logout hủy session, xóa cookie phiên/CSRF và ghi authentication event. Frontend xử lý 401 toàn cục, cảnh báo 2 phút trước khi hết phiên, cho duy trì phiên và không giữ trang bảo vệ trong history sau logout.

Chưa đủ điều kiện mở Internet hoặc gọi là xác thực cấp cao vì chưa có MFA/passkey, luồng khôi phục/đặt lại mật khẩu có kiểm soát, khóa/chậm dần theo tài khoản, quản lý phiên trên nhiều node và quy trình tích hợp IdP/SSO.

## Đối chiếu chuẩn và hệ thống lớn

| Nguyên tắc | Bản local | Nguồn đối chiếu |
| --- | --- | --- |
| Logout chủ động và hủy bí mật phiên | Đạt; session invalidated, hai cookie hết hạn, đường dẫn bảo vệ trả 401 | NIST SP 800-63B-4, mục session termination |
| Lỗi đăng nhập không lộ tài khoản có tồn tại | Đạt; cùng mã/lời nhắn và vẫn chạy BCrypt giả | OWASP Authentication Cheat Sheet |
| Giao diện ít xao nhãng, label tường minh, có hiện mật khẩu | Đạt; một tác vụ/một cột, trạng thái status/alert, không tạo link khôi phục giả | USWDS Sign-in Form; Microsoft authentication UX |
| Cảnh báo trước timeout | Đạt ở FE khi server phát `X-Session-Expires-At`; ngưỡng 2 phút | USWDS Authentication Pages |
| Timeout không hoạt động và tuổi thọ tuyệt đối | Đạt 30 phút/12 giờ; mức nội bộ bảo thủ, không tuyên bố AAL2 | NIST SP 800-63B-4 |
| Bảo vệ brute force | Một lớp IP rate limit ở Nginx (`30r/m`, burst `10`); chưa có progressive delay theo tài khoản | Cần hoàn thiện trước pilot công khai |
| MFA/passkeys và khôi phục tài khoản | Chưa có | Microsoft/Google-class systems dùng MFA/passkeys và recovery có kiểm chứng |

Nguồn chính:

- https://pages.nist.gov/800-63-4/sp800-63b.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- https://designsystem.digital.gov/templates/form-templates/sign-in-form/
- https://designsystem.digital.gov/templates/authentication-pages/sign-in/
- https://techcommunity.microsoft.com/blog/microsoft-entra-blog/new-user-experience-for-consumer-authentication/3822035

## Bằng chứng kiểm thử

- Backend: 16 test đạt, gồm lỗi chung, session thật, logout rồi dùng lại session bị 401, cookie bị xóa, tuổi thọ 12 giờ và migration PostgreSQL 18.
- Frontend: format, 2 unit test, production AOT build và budget đều đạt.
- Browser production-like: guard → lỗi sai mật khẩu → hiện/ẩn mật khẩu → đăng nhập → các workspace → logout API 200 → cookie `CAMPAIGN_SESSION` không còn → truy cập lại bị đưa về login; desktop và mobile không có console/page error.
- Supply chain: `npm audit --omit=dev` = 0; Trivy trên Java CycloneDX SBOM = 0 high/critical fixable. Quét đầy đủ OS image vẫn do CI thực thi trước phát hành.

## Gate trước pilot/production

1. Chọn IdP/SSO và bắt buộc MFA/passkey ít nhất cho Superadmin/Admin; không tự phát triển MFA nếu có thể dùng IdP chuẩn.
2. Thiết kế recovery/reset password có xác minh, audit và thu hồi mọi session liên quan.
3. Thêm progressive throttling theo tài khoản kết hợp IP, không dùng khóa cứng dễ gây từ chối dịch vụ.
4. Chạy HTTPS thật; `APP_SESSION_COOKIE_SECURE=true` là mặc định profile prod, chỉ tắt cho HTTP local 4318.
5. Chọn chiến lược session dùng chung/thu hồi nếu chạy nhiều backend instance; hiện phù hợp một instance.
6. Pentest theo phạm vi, rà soát log/PII, diễn tập backup-restore và incident response trước pilot.
