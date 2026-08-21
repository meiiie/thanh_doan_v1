# Module identity-access — hồ sơ chốt local/UAT

Cập nhật: 21/08/2026
Chủ thể vận hành: Thành đoàn Hải Phòng
Trạng thái: **Chốt luồng login/password-session cho local/UAT; chưa tuyên bố production authentication hoàn chỉnh.**

## 1. Phạm vi đã đóng

- Đăng nhập `identifier-first` trên một URL; bước định danh không gọi API dò tài khoản.
- Xác thực username/password tại Spring backend, phản hồi lỗi chung cho sai tên, sai mật khẩu và tài khoản bị khóa.
- Khi xác thực thất bại, mật khẩu được giữ trong state sống của biểu mẫu để người dùng sửa, lập tức che lại và không ghi vào web storage/log; `Sửa` hoặc `Quay lại` vẫn xóa mật khẩu.
- Phiên server-side bằng cookie; Angular không lưu session ID, access token hoặc password trong web storage.
- CSRF cho mọi lệnh thay đổi trạng thái, kể cả login, đổi mật khẩu và logout.
- Đổi mật khẩu bắt buộc với tài khoản mới; trước khi đổi, backend trả `428 PASSWORD_CHANGE_REQUIRED` cho API nghiệp vụ.
- Màn đổi mật khẩu dùng chung ngôn ngữ hình học với login: mặt phẳng toàn viewport, một trục tác vụ 448 px, control 52 px, SVG hiện/ẩn riêng từng trường, một CTA chính và một hành động đăng xuất phụ.
- Đăng xuất bằng `POST`, hủy phiên, xóa session/CSRF cookie và xóa state phía Angular.
- Route theo bốn vai trò; server tiếp tục kiểm campaign, capability, organization, team và assignment ở use case.
- Timeout không hoạt động 30 phút, trần phiên tuyệt đối 12 giờ và thông báo hai phút cuối.
- Superadmin tạo, khóa/mở khóa tài khoản; thay đổi trạng thái và audit cùng transaction. Tài khoản bị khóa biến mất khỏi lựa chọn nhận việc nhưng vẫn còn trong dấu vết lịch sử.

Không nằm trong quyết định đóng này: tự đăng ký, email/phone login, quên mật khẩu tự phục vụ, OAuth/OIDC, SAML, passkey, TOTP, remember-me hoặc social login. Không dựng UI giả cho use case chưa được duyệt.

## 2. Luồng chuẩn

```text
Khách
  → nhập tên đăng nhập
  → nhập mật khẩu
  → POST /api/auth/login + CSRF
  → phiên mới, cookie Secure/HttpOnly/SameSite=Strict
     ├─ tài khoản mới → /change-password → workspace theo vai trò
     └─ tài khoản đã sẵn sàng → workspace theo vai trò

401 hoặc phiên hết hạn
  → xóa state local
  → /login?reason=session-expired&returnUrl=<đường dẫn nội bộ>

Đăng xuất
  → POST /api/auth/logout + CSRF
  → audit LOGOUT + invalidate session + expire cookies
  → /login
```

`returnUrl` chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng một `/`, từ chối `//` và `/login`; route guard không được coi là lớp bảo mật, chỉ là điều hướng hỗ trợ người dùng.

## 3. Giao thức và kiểm soát

| Biên | Quyết định hiện hành | Bằng chứng |
| --- | --- | --- |
| Transport | HTTPS local qua TLS 1.2/1.3; HSTS; profile prod buộc secure session cookie | `ops/tls-proxy.conf`, `application-prod.yml` |
| Credential exchange | JSON same-origin qua `POST /api/auth/login`; không Basic/Form login | `SecurityConfiguration`, `AuthenticationController` |
| Password storage | BCrypt cost 12, salt theo encoder, giới hạn 15–72 ký tự | `SecurityConfiguration`, `AuthenticationService` |
| Enumeration | Dummy hash cho username không tồn tại; cùng HTTP 401 và Problem Detail chung | `AuthenticationService`, `SystemApiIntegrationTest` |
| Session | Server-side `CAMPAIGN_SESSION`, HttpOnly, SameSite Strict; thay session khi login và cấp lại CSRF token cho session mới | `application.yml`, `AuthenticationService`, `AuthService` |
| CSRF | Cookie/header synchronizer token; chỉ same-origin `/api/` được interceptor gắn header | `SecurityConfiguration`, `csrf.interceptor.ts` |
| Authorization | Mặc định yêu cầu xác thực; role ở route và kiểm scope/capability lại trong application service | `SecurityConfiguration`, `CurrentActor`, use-case services |
| First login | Tài khoản do Superadmin tạo luôn phải đổi mật khẩu; current password được kiểm lại | `AccountAdministrationService`, `SessionActorAuthenticationFilter` |
| Logout | POST + CSRF; audit, invalidate session, expire `CAMPAIGN_SESSION` và `XSRF-TOKEN` | `AuthenticationService`, `SessionCookies` |
| Audit | Thành công/thất bại login, logout và đổi mật khẩu được ghi trong transaction | `authentication_event`, `AuthenticationService` |
| Roster status | `PATCH /api/accounts/{id}/status`; cấm tự khóa tài khoản đang dùng; audit `LOCK_ACCOUNT/UNLOCK_ACCOUNT` | `AccountAdministrationService`, `SystemApiIntegrationTest` |
| Anti-automation | Nginx giới hạn login 30 request/phút/IP, burst 10; TLS edge có bucket tổng | `app/frontend/nginx.conf`, `ops/tls-proxy.conf` |

Đối chiếu ngày 20/08/2026: NIST SP 800-63B-4 yêu cầu mật khẩu single-factor tối thiểu 15 ký tự, cho phép password manager/paste/show-password và lưu hash chống tấn công offline; OWASP khuyến nghị lỗi chung, current-password khi đổi mật khẩu, TLS, throttling và MFA cho tài khoản đặc quyền. Phạm vi local đáp ứng phần password/session nêu trên, nhưng không được diễn giải thành đạt AAL2 vì chưa có yếu tố thứ hai.

## 4. Vai trò và điểm vào

| Vai trò | Tài khoản duyệt local | Đường vào mặc định | Ranh giới chính |
| --- | --- | --- | --- |
| `SUPERADMIN` | `superadmin` | `/superadmin/lifecycle` | Toàn quyền hệ thống, tạo cơ cấu/tài khoản; vẫn chịu snapshot bất biến và bốn mắt |
| `CAMPAIGN_ADMIN` | `uat.admin` | `/admin/scorecard-templates` | Quản trị chiến dịch theo campaign/capability, không quản trị tài khoản hệ thống |
| `REVIEWER` | `uat.reviewer` | `/reviewer/queue` | Chỉ case thuộc tổ và phân công của mình |
| `UNIT_MEMBER` | `uat.unit.dhcd` | `/unit/tasks` | Chỉ hồ sơ thuộc organization của mình |

Tài khoản UAT local được tạo ngoài migration bằng `ops/provision-local-uat-accounts.ps1`. Password ngẫu nhiên của ba actor `uat.*` chỉ nằm trong `.tmp/local-uat-accounts.json`; password Superadmin nằm trong `.tmp/secure-local-superadmin.password`. Cả hai bị Git bỏ qua. Dữ liệu `LAB-*` không phải dữ liệu khách hàng và không được xuất sang staging/production.

Roster nguồn dùng `ops/provision-source-roster.ps1`, tách khỏi UAT fixture. Năm người theo dõi Tổ (SubAdmin1) và 20 cán bộ chấm (SubAdmin2) cùng dùng role kỹ thuật `REVIEWER`; capability `review.team.overview` chỉ mở projection theo dõi Tổ cho SubAdmin1, không trao quyền duyệt/chấm thay. Username ổn định không sinh từ tên cá nhân; credential plaintext chỉ có trong sổ bàn giao local bị Git bỏ qua và mọi tài khoản mới phải đổi mật khẩu lần đầu.

## 5. Bằng chứng chốt

- Backend integration: deny-by-default, lỗi chung, session thật, absolute lifetime, forced password change, role/scope và audit.
- Frontend unit: identifier-first, không gọi API sớm, forced-change validation, giữ giá trị để sửa, focus đúng trường, icon accessible, role routing, CSRF store và cảnh báo timeout.
- Browser E2E: login thật, forced-change route, sai mật khẩu, show/hide, return URL, logout/cookie removal, responsive và axe WCAG 2.2 AA.
- Runtime HTTPS 4319: login/logout `200`; `CAMPAIGN_SESSION` là `Secure + HttpOnly`; `XSRF-TOKEN` là `Secure`; HSTS/CSP có mặt; cookie jar rỗng sau logout.
- Local UAT account harness đăng nhập và probe API thành công cho cả Admin, Reviewer và Unit; browser role smoke khóa route, heading, axe, overflow, console và logout từng workspace.
- Unit và role smoke khóa việc làm mới CSRF token sau khi login thay anonymous session, trước authenticated write đầu tiên.

Formal Codex Security workbench không sinh report trong lần chốt này vì công cụ từ chối scope nhiều thư mục trước khi tạo scan. Đây là giới hạn bằng chứng, không được ghi thành “formal security scan passed”. Kiểm định mã nguồn, test và runtime vẫn được chạy độc lập bằng harness dự án.

## 6. Cổng bắt buộc trước production

1. Chọn và tích hợp IdP/OIDC hoặc phương án MFA/passkey; ít nhất Superadmin/Admin phải có yếu tố thứ hai.
2. Quyết định recovery/reset và xác minh danh tính ngoài băng; không tự suy diễn email/SMS.
3. Bổ sung blocklist mật khẩu phổ biến/rò rỉ và chiến lược chuyển BCrypt sang Argon2id hoặc IdP quản lý credential.
4. Bổ sung throttling theo account bên cạnh bucket IP, cảnh báo/quan sát lockout và quy trình mở khóa chống DoS.
5. Quyết định thu hồi toàn bộ phiên khi đổi/reset password, khóa account hoặc thay đổi đặc quyền; nếu scale ngang phải dùng session store chung hoặc sticky session có chủ đích.
6. Kiểm thử trên staging có CA/domain thật, clock đồng bộ, log/alert, proxy chain và UAT screen reader.

Các mục này là production gates có chủ đích, không phải lý do giữ màn `/login` tiếp tục thay đổi. Login UX và contract password-session local chỉ mở lại khi use case hoặc threat model thay đổi.
