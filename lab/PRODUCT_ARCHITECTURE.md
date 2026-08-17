# Kiến trúc sản phẩm và DDD

Ngày quyết định: 12/08/2026  
Trạng thái: Proposed — đủ để thiết kế UX, chưa phải lệnh scaffold production.

## 1. Bài toán đúng

Đây không phải “Excel trên web”. Hệ thống là một **workflow ra quyết định có bằng chứng**, bảo đảm một kết quả điểm có thể trả lời được:

- ai khai báo, ai chấm, ai sửa và ai chốt;
- tiêu chí và quy tắc nào có hiệu lực tại thời điểm đó;
- bằng chứng nào được dùng;
- vì sao điểm thay đổi giữa tự chấm, vòng 1, giải trình và vòng 2;
- hồ sơ có bị mở lại hay không và căn cứ của hành động đó.

Quy mô đầu vào đã xác định: khoảng 134 đơn vị, 164 tài khoản, 5 tổ chuyên môn; workflow `tự chấm → vòng 1 → công bố → giải trình → vòng 2 → chốt`.

## 2. Lựa chọn nền tảng

### Quyết định

- Frontend: **Angular 22**, standalone components, signals, OnPush.
- Backend: **Spring Boot 4.1 / Spring Framework 7**. Java 25 LTS là baseline đích; walking skeleton local biên dịch ở Java 21 LTS đang có trên máy và không dùng API riêng của 21 để giữ đường nâng cấp thẳng.
- Database: **PostgreSQL 18**.
- Giao tiếp: REST/JSON, contract-first OpenAPI; client Angular được sinh từ contract.
- Kiến trúc triển khai: một modular monolith, một cơ sở dữ liệu, hai process local (`frontend`, `backend`).
- Migration: Flyway; mỗi migration bất biến và chạy lại được trên database sạch.
- Authentication: OIDC khi tích hợp hạ tầng thật; local dùng session phía server, BCrypt và CSRF. Tài khoản bootstrap có mật khẩu ngẫu nhiên ngoài source; không có actor header hoặc đổi vai ở trình duyệt.

### Lý do

Angular/Spring/PostgreSQL kế thừa trực tiếp năng lực và quy ước từ LMS HoLiLiHu. Angular 22 đang active support; Spring Boot 4.1 là stable và tương thích Java 17–26; Java 25 là LTS; PostgreSQL 18.4 là nhánh stable hiện tại. Vinext của prototype đang ở beta, không phù hợp làm nền tảng sở hữu lâu dài.

### Những thứ cố ý chưa dùng

- Không microservices: quy mô và tổ chức vận hành chưa tạo ra lợi ích bù chi phí phân tán.
- Không GraphQL: màn hình là task/workflow có hợp đồng rõ; REST dễ audit, cache và kiểm thử hơn.
- Không Kafka/message broker: tác vụ chính cần tính nhất quán giao dịch. Sự kiện miền chạy in-process; chỉ thêm outbox khi có consumer thật.
- Không Redis: chưa có tải hoặc use case chứng minh nhu cầu.
- Không CQRS framework: có thể tách DTO đọc/ghi trong module mà không nhân đôi hạ tầng.
- Không generic repository hay base service: aggregate nào có hành vi thì có port riêng; CRUD thẳng dùng application service.

## 3. Bounded contexts

| Module | Sở hữu | Không sở hữu |
|---|---|---|
| `identity-access` | tài khoản, vai trò, scoped grant, khóa/mở tài khoản | cấu trúc đơn vị |
| `organization` | nhóm đơn vị, đơn vị, tổ chuyên môn, thành viên | thông tin đăng nhập |
| `campaign` | chiến dịch, giai đoạn, deadline, đơn vị tham gia | nội dung bảng điểm |
| `scorecard` | phiên bản bảng tiêu chí, tiêu chí, chỉ báo, trần điểm, applicability rule | điểm thực tế của hồ sơ |
| `submission` | hồ sơ đơn vị, tự chấm, minh chứng, gửi hồ sơ, mở lại | quyết định của chuyên viên |
| `review` | phân công, vòng chấm, nhận xét, giải trình, quyết định vòng 2 | công bố kết quả cuối |
| `results` | tính/tái tính, snapshot cuối, xếp hạng, công bố, xuất dữ liệu | sửa dữ liệu nguồn |
| `audit` | audit trail bất biến, truy vết hành động, đối soát | log kỹ thuật/debug |

`file-storage` ban đầu là adapter của `submission`, không phải bounded context độc lập. Nếu chính sách chỉ cho phép liên kết, adapter này chỉ xác thực và lưu URL.

## 4. Aggregate và bất biến cốt lõi

### Campaign

- Chỉ một trạng thái có hiệu lực tại một thời điểm.
- Chuyển trạng thái theo state machine; không cập nhật chuỗi trạng thái tùy ý.
- Mở lại hồ sơ cần quyền, lý do, phạm vi, thời hạn và audit.

### ScorecardVersion

- Phiên bản đã phát hành là bất biến.
- Hồ sơ luôn trỏ đến một phiên bản cụ thể.
- Tổng điểm không vượt trần; chỉ báo không áp dụng không đi vào mẫu số/tổng theo quy tắc được duyệt.

### Submission

- Một hồ sơ cho một `(campaign, unit)`.
- Chỉ đơn vị trong scope mới sửa được; server kiểm tra ownership ở mọi lệnh.
- Gửi hồ sơ cần đạt điều kiện completeness; gửi lại cần explicit reopen.
- Mỗi minh chứng gắn với tiêu chí/chỉ báo, người nộp và thời điểm.

### ReviewCase

- Assignment xác định chuyên viên/tổ có quyền ra quyết định.
- Vòng 2 không ghi đè lịch sử vòng 1; mỗi quyết định là một revision có tác giả.
- Điểm khác tự chấm cần nhận xét theo quy tắc cấu hình.
- Giải trình chỉ được tạo trong cửa sổ thời gian và đối với mục cho phép.

### FinalResult

- Là snapshot bất biến của dữ liệu đã chốt, kèm version và checksum.
- Recalculate trước chốt là idempotent; sau chốt phải qua quy trình hủy/chốt lại được audit.

## 5. Cấu trúc code đề xuất

```text
app/
├─ frontend/                     # Angular 22
│  └─ src/app/
│     ├─ core/                   # auth, router, HTTP, error boundary
│     ├─ shell/                  # role shells; không chứa nghiệp vụ
│     ├─ features/               # campaign, submission, review, results...
│     └─ shared/                 # primitive UI thật sự dùng chung
├─ backend/                      # Spring Boot modular monolith
│  └─ src/main/java/.../
│     ├─ campaign/
│     │  ├─ domain/
│     │  ├─ application/
│     │  └─ infrastructure/
│     ├─ scorecard/
│     ├─ submission/
│     ├─ review/
│     ├─ results/
│     └─ audit/
├─ contracts/openapi.yaml
├─ e2e/
├─ fixtures/
└─ docs/
```

Dependency direction trong từng module: `domain ← application ← infrastructure`. Domain không import Spring/JPA/HTTP. Spring Modulith kiểm tra ranh giới module và sinh sơ đồ; không dùng nó để tạo thêm tầng vô nghĩa.

## 6. Giao dịch, đồng thời và audit

- Command thay đổi điểm dùng optimistic locking (`version`) và trả `409` kèm bản hiện tại khi xung đột.
- Submit/finalize/reopen nhận idempotency key.
- Business audit được ghi trong cùng database transaction với thay đổi; event gồm `when, who, action, object, before/after summary, reason, correlationId`.
- Log bảo mật và log vận hành tách khỏi business audit; không ghi token, mật khẩu hoặc nội dung tệp nhạy cảm.
- Mọi truy vấn dữ liệu phải có scope; không dựa vào việc ẩn nút ở frontend.

## 7. API theo use case

Không thiết kế API CRUD chung cho mọi bảng. Ví dụ:

```text
GET  /api/me/tasks
GET  /api/review-queue?team=&status=&cursor=
GET  /api/submissions/{id}/workspace
PUT  /api/submissions/{id}/self-scores/{indicatorId}
POST /api/submissions/{id}:submit
POST /api/submissions/{id}:reopen
POST /api/review-cases/{id}/round-1-decisions
POST /api/review-cases/{id}/explanations
POST /api/review-cases/{id}/round-2-decisions
POST /api/campaigns/{id}:finalize
GET  /api/results/{id}/trace
```

Command trả trạng thái mới, version và liên kết tiếp theo. Error dùng Problem Details; mã lỗi ổn định để UI dịch sang tiếng Việt.

## 8. Rủi ro và quyết định còn thiếu từ khách hàng

| Quyết định cần chốt | Ảnh hưởng nếu chưa chốt |
|---|---|
| Ai được mở lại hồ sơ và mở lại đến cấp nào | quyền, state machine, audit |
| Điểm cuối khi vòng 1/vòng 2 khác nhau | aggregate review, công thức kết quả |
| Quy tắc “không áp dụng” và mẫu số | công thức, dashboard, export |
| Minh chứng là URL hay tệp; dung lượng/retention | storage, antivirus, backup |
| Một chuyên viên có thể thuộc nhiều tổ không | mô hình assignment và sidebar |
| Công bố theo toàn chiến dịch hay từng nhóm | state machine, thông báo |
| SLA giải trình và xử lý quá hạn | task queue, cảnh báo, quyền override |

## 9. Nguồn chuẩn đã đối chiếu

- Angular support/version compatibility: https://angular.dev/reference/versions và https://angular.dev/reference/releases
- Spring Boot 4.1 system requirements: https://docs.spring.io/spring-boot/system-requirements.html
- Spring Modulith: https://docs.spring.io/spring-modulith/reference/
- Java SE support roadmap: https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- PostgreSQL 18: https://www.postgresql.org/docs/18/release.html
- OWASP ASVS 5.0: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- NIST SSDF: https://csrc.nist.gov/pubs/sp/800/218/final
