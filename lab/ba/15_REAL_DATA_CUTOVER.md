# Chuyển runtime sang đăng nhập và dữ liệu có nguồn

Cập nhật: 14/08/2026  
Phạm vi: local-only, chưa deploy.

## 1. Kết quả

Runtime hiện không còn giả lập người dùng hoặc dữ liệu nghiệp vụ. Luồng khởi động là:

`Mật khẩu bootstrap ngẫu nhiên → đăng nhập phiên → Superadmin tạo tài khoản thật → đổi mật khẩu lần đầu → đọc campaign/scorecard có provenance → chỉ phát sinh hồ sơ khi có đơn vị và phân công thật`

Các màn chưa có dữ liệu trả empty state từ database. Hệ thống không tạo tên cán bộ, đơn vị, điểm, minh chứng hay kết quả để làm đầy giao diện.

## 2. Nguồn seed được phép

| Tập dữ liệu | Nguồn | Số lượng |
| --- | --- | ---: |
| Campaign TNTN Hè 2026 | tên workbook/tài liệu dự án | 1 |
| Khối đơn vị | `duananhCuong.pdf` | 4 khối, 134 đơn vị tổng hợp |
| Hạng mục | workbook ĐH/CĐ | 27 |
| Dòng chấm | workbook ĐH/CĐ | 55 |
| Điểm cơ bản | công thức workbook | 83 |
| Điểm thưởng thô/trần | workbook | 69 / 25 |

Migration lưu tên tệp, semantic range và SHA-256 nguồn. Dữ liệu người dùng còn thiếu được xem là backlog onboarding, không phải chỗ để dùng mock.

## 3. Phân hệ và dependency

```text
Angular
├─ core/auth           phiên, guard, home theo vai trò
├─ shell               navigation và current identity
├─ features/campaign   readiness projection
├─ features/scorecard  bảng 55 dòng từ API
├─ admin/accounts      tạo/list account thật
├─ unit/tasks          queue theo scope
└─ reviewer/queue      queue theo assignment

Spring modular monolith
├─ identity-access     account, session, role, scoped grant, auth audit
├─ campaign            phase và readiness
├─ scorecard           source document, version, group, line, policy
├─ submission          aggregate/revision
├─ review              case/decision/explanation
├─ results             immutable final snapshot
└─ audit               business audit cùng transaction
```

Domain không phụ thuộc Spring/JDBC/HTTP. API được thiết kế theo use case; không có generic repository, base service hoặc CRUD giả định.

## 4. Quyền Superadmin

Superadmin có toàn bộ capability và scope. Backend tự nhận diện danh tính từ session; frontend không gửi actor ID. Superadmin có thể mở workspace Admin, Unit và Reviewer để quan sát/thực hiện use case phù hợp.

Các bất biến vẫn có hiệu lực:

- mọi write có audit trong cùng transaction;
- released scorecard/final result là snapshot bất biến;
- người lập và người duyệt kết quả phải là hai tài khoản khác nhau;
- version/idempotency không bị bypass;
- hành động vẫn ghi đúng danh tính Superadmin, không giả danh vai trò khác.

## 5. Gate trước khi nối lại submission/review/results

1. Nhập danh sách đơn vị thật và định danh bốn khối.
2. Tạo tài khoản cá nhân thật; không dùng tài khoản chia sẻ ngoài bootstrap khẩn cấp.
3. Khai báo năm tổ và thành viên được xác nhận.
4. Chốt ma trận hạng mục × khối và assignment thật.
5. Sau đó mới tạo hồ sơ/dòng tự chấm và nối state machine vào UI.

Walking-skeleton cũ vẫn hữu ích như bằng chứng domain trong lịch sử tài liệu, nhưng endpoint và dữ liệu giả đã bị loại khỏi runtime.
