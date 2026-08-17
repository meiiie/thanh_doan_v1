# Điều hành chiến dịch

Hệ thống riêng tư để 16 đơn vị Đại học, Cao đẳng tự chấm, năm tổ chuyên môn
thẩm định hai vòng, tiếp nhận giải trình và chốt kết quả Chiến dịch Thanh niên
tình nguyện Hè 2026. Danh mục nền có đủ 134 đơn vị để mở rộng khi có bảng điểm
chính thức cho ba nhóm còn lại.

Admin có thể thay hạn có audit, đặt ngoại lệ áp dụng theo đơn vị, quản lý ánh xạ
tài khoản, xuất CSV/lịch sử chốt và tải backup JSON đầy đủ.

## Chạy và kiểm tra

Yêu cầu Node.js `>=22.13.0`.

```bash
npm ci
npm run dev
npm run check
```

`npm run check` chạy lint, typecheck, 11 kiểm thử miền/bảo mật, production build
và smoke E2E toàn quy trình qua server + D1 thật. Migration nguồn nằm tại
`drizzle/0000_pale_callisto.sql`; runtime vẫn bootstrap idempotent để bản triển khai
mới có thể khởi động lạnh an toàn.

## Bắt đầu đọc

- `SPEC.md` — hợp đồng sản phẩm và tiêu chí nghiệm thu.
- `DESIGN.md` — hướng thiết kế và token.
- `docs/CODEMAP.md` — bản đồ mã nguồn.
- `docs/DECISIONS.md` — các quyết định kiến trúc và giả định có chủ đích.
- `docs/OPERATIONS.md` — triển khai, cấp quyền, sao lưu và xử lý sự cố.
- `docs/THREAT_MODEL.md` — biên tin cậy và kiểm soát bảo mật.
- `docs/COMPLETION_AUDIT.md` — ma trận yêu cầu → bằng chứng và đầu vào còn thuộc khách hàng.

Không đưa mật khẩu, dữ liệu minh chứng, email production, state D1 cục bộ hoặc file
`.env` vào Git. Identity do Sites cung cấp; ứng dụng chỉ giữ allowlist vai trò/phạm
vi. Bằng chứng bản đầu là URL HTTPS thuộc quyền kiểm soát của tổ chức.
