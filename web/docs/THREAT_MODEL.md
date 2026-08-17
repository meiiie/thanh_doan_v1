# Threat model tối thiểu

## Tài sản và biên tin cậy

Tài sản cần bảo vệ: identity/allowlist, nội dung tự chấm, URL minh chứng, quyết định
chấm, giải trình, kết quả và audit. Trình duyệt là không tin cậy; Sites xác thực
identity; Worker là biên authorization; D1 là nguồn dữ liệu có thẩm quyền. URL minh
chứng dẫn sang kho tài liệu ngoài ứng dụng và phải do tổ chức kiểm soát.

## Nguy cơ và kiểm soát

| Nguy cơ | Kiểm soát hiện có |
|---|---|
| Truy cập sai đơn vị/tổ | Authorization server-side theo role + unit/team cho mọi read/write |
| Giả mạo request | Private Site, kiểm tra same-origin, POST-only, redirect nội bộ an toàn |
| Gửi lặp | Idempotency key lưu trong D1 trước mutation |
| Sửa điểm ngoài khung/giai đoạn | Validation miền, bước 0,5, deadline và phase trên server |
| Che giấu lịch sử | Review/explanation/snapshot append-only và audit cho mọi mutation |
| CSV formula injection | Prefix ký tự nguy hiểm trước khi escape CSV |
| XSS/URL nguy hiểm | React escaping, giới hạn độ dài, chỉ nhận URL `https:` |
| Clickjacking/cache/script ngoài | CSP, `DENY`, `nosniff`, `no-referrer`, HTML `private, no-store`, HSTS |
| Lộ dữ liệu qua log/Git | Không log nội dung minh chứng; ignore env, D1 state, reports |
| Mất dữ liệu | Snapshot bất biến, CSV checkpoint và backup D1 theo runbook |

## Rủi ro còn lại có chủ đích

- Link ngoài có thể đổi hoặc mất quyền; vận hành phải dùng kho có versioning/retention.
- Direct upload chưa mở vì chưa chốt malware scanning, loại file và retention.
- Bootstrap owner tin cậy access policy của private Site; vì vậy Site phải được tạo
  riêng tư trước lần truy cập đầu tiên.
- CSP dùng inline compatibility cho Vinext/RSC; nonce strict-dynamic là hardening
  tiếp theo nếu runtime cung cấp nonce ổn định mà không phá hydration.
