# UX refinement — 15/08/2026

Phạm vi: login, đổi mật khẩu, shell đa vai trò, vòng đời chiến dịch, các workbench bảng, cơ cấu tổ chức, tài khoản và kết quả cuối. Trạng thái: đã áp dụng local, chưa deploy.

## Chẩn đoán trước thay đổi

1. Login dùng một card 400 px đặt giữa viewport lớn, tạo khoảng trống nhưng không tạo hierarchy.
2. Sáu KPI trên trang vòng đời có cùng trọng lượng dù thuộc ba nhóm ngữ nghĩa khác nhau.
3. Workbench dùng nhiều chữ 9–11 px và control 32–36 px; đọc được khi chụp toàn màn hình nhưng không bền vững với người dùng thực.
4. Eyebrow viết hoa, pill và màu brand cũ xuất hiện cục bộ thay vì dùng token chuẩn.
5. Navigation chỉ đổi màu nền; chưa có chỉ báo hình học độc lập với màu.

## Hệ phương trình đã áp dụng

Đặt `u = 4 CSS px`.

### Login desktop

```text
W = min(V − 64, 1040)
H = min(680, viewport height − 68)
context : form = 1.15 : 0.85
outer inset = 8u
panel inset = 12u
```

Ở `V = 1512`, khung giữ 1040 px; cột ngữ cảnh và cột form xấp xỉ 598/442 px. Form không vượt quá một trường nhìn và chỉ có một primary action. Khi `V ≤ 760`, lưới về một cột; phần thuyết minh biến mất nhưng tên sản phẩm, `h1`, form, hỗ trợ và thông tin phiên vẫn còn.

### Trang nội dung

```text
content max = 1440
page inset = clamp(20, 2.5vw, 40)
normal top/bottom = 32/48
workbench top/inline/bottom = 16/20/24
```

### Component

```text
body floor = 12px
dense control = 40px
default control = 44px
table header = 40px
navigation row = 44px
active indicator = 3 × 24px
```

Chữ 12 px chỉ dùng cho metadata, header bảng và trạng thái; nội dung/hành động dùng 13 px trở lên. Các số liệu dùng tabular numerals.

## Quyết định hierarchy

- Login: thương hiệu/ngữ cảnh ở trái, xác thực ở phải; mobile giữ duy nhất nhiệm vụ xác thực.
- Vòng đời: `Nguồn tiêu chí`, `Phạm vi triển khai`, `Vận hành hiện tại`; mỗi nhóm chứa hai đại lượng có quan hệ.
- Workbench: bảng tiếp tục là bề mặt chính và cuộn trong container. Không biến từng dòng Excel thành card trên mobile vì sẽ phá quan hệ cột; người dùng mobile được xem phần định danh/nội dung trước, còn thao tác đầy đủ ưu tiên tablet/desktop.
- Status dùng rectangle radius 6–8 px, không dùng pill cho metadata.
- Sidebar active có cả nền, chữ và vạch 3 × 24 px nên không phụ thuộc riêng vào màu.

## Accessibility và kiểm định

- Axe phát hiện chữ phụ trên nền `#F3F7FC` thiếu tương phản; đã đổi từ `muted` sang `ink-2`.
- Toàn bộ text trong component nghiệp vụ có kích thước tối thiểu 12 px.
- Control dense tối thiểu 40 px; control mặc định 44 px.
- Focus ring dùng một token `--focus`; pressed feedback chỉ animate transform.
- Browser smoke kiểm tra login desktop/mobile, không tràn ngang, asset logo tải được, console sạch, đăng nhập/đăng xuất và các route Superadmin.
- Production bundle initial 291.52 kB; component style warning 9 kB, hard error 12 kB.

## Bằng chứng

- `../../app/frontend/artifacts/login-desktop.png`
- `../../app/frontend/artifacts/login-mobile.png`
- `../../app/frontend/artifacts/real-data-lifecycle-desktop.png`
- `../../app/frontend/artifacts/source-scorecard-desktop.png`
- `../../app/frontend/artifacts/source-scorecard-mobile.png`

