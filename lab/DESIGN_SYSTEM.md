# Design system — Clear Civic

## 1. DNA và lập trường

HoLiLiHu đóng góp bốn DNA tốt: cấu trúc mạnh, điều hướng theo vai trò, nhịp 8px và primary blue rõ. Lab loại bỏ sự xung đột hiện có giữa `#0056D2` và `#1C5C86`, giữa Inter/Roboto/Source Sans Pro, cũng như card/shadow dùng quá rộng.

Tinh thần: **tối giản đến mức chỉ còn quyết định cần làm**. Không “trang trí cho hiện đại”; vẻ cao cấp đến từ khoảng trắng, tỷ lệ, chữ, sự nhất quán và trạng thái có chủ đích.

## 2. Token nguồn duy nhất

### Color

```css
:root {
  --brand-600: #0756c9;
  --brand-700: #0649aa;
  --brand-800: #053f92;
  --brand-050: #edf5ff;

  --ink-950: #111827;
  --ink-700: #374151;
  --ink-600: #6b7280;
  --ink-500: #9ca3af;

  --page: #f8fafc;
  --surface: #ffffff;
  --surface-subtle: #f9fafb;
  --border: #e5e7eb;
  --border-strong: #d1d5db;

  --success-700: #047857;
  --success-050: #ecfdf5;
  --warning-700: #92400e;
  --warning-050: #fffbeb;
  --danger-700: #b91c1c;
  --danger-050: #fef2f2;
  --info-700: #1d4ed8;
  --info-050: #eff6ff;

  --focus: #0756c9;
}
```

Không dùng pure black. Không tự tạo opacity cho text. Mỗi tổ hợp text/background phải kiểm tra tương phản.

### Typography

- UI: `system-ui`, fallback `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.
- Dữ liệu/mã: `IBM Plex Mono`, fallback `Consolas`, `monospace`.
- Display 32/40, -0.02em, 700.
- H1 28/36, -0.015em, 700.
- H2 22/30, 600.
- H3 18/26, 600.
- Body 15/24, 400; body strong 600.
- Small 13/20; metadata 12/18.

Giới hạn hai weight thường xuyên (400, 600); 700 chỉ cho title. Không viết hoa câu dài.

### Spacing và layout

```text
space: 4, 8, 12, 16, 24, 32, 48, 64
sidebar: 256 / 64
topbar: 64
content max: 1440
review detail pane: 360
table row: 52
control: 40 (dense), 44 (default), 48 (touch-important)
```

Không dùng số lẻ ngoài trường hợp optical alignment được ghi chú.

### Radius, border, elevation

```text
control 8 · panel 12 · dialog 16 · pill 999 chỉ cho tag
border 1px solid var(--border)
shadow mặc định: none
overlay: 0 12px 32px rgba(11, 31, 51, .12)
focus: 0 0 0 3px rgba(20, 95, 215, .24)
```

Panel phân nhóm bằng spacing và border trước khi dùng shadow. Không gradient, glassmorphism, glow hay card nổi cho mọi thứ.

### Motion

```text
fast 120ms · normal 180ms · deliberate 240ms
standard cubic-bezier(.2, 0, 0, 1)
exit cubic-bezier(.4, 0, 1, 1)
```

Chỉ animate opacity/transform; hỗ trợ `prefers-reduced-motion`. Không animation trang trí hoặc trì hoãn phản hồi.

## 3. Component grammar

### Button

- Primary: một hành động chính trong một vùng; blue solid.
- Secondary: white + border.
- Tertiary: text/icon, không border.
- Danger: chỉ cho hành động phá hủy/mở lại có hệ quả; không dùng đỏ để thu hút chung.
- Loading giữ nguyên chiều rộng; disabled luôn có lý do ở ngữ cảnh.

### Status

Badge dùng nền tint + text đậm, kèm icon nếu cần. Không biến mọi metadata thành pill. Tên trạng thái chuẩn:

`Chưa bắt đầu · Đang làm · Thiếu minh chứng · Đã gửi · Đang thẩm định · Chờ giải trình · Đã hoàn thành · Quá hạn · Đã chốt`

### Table/list

- Table cho so sánh thuộc tính lặp; task list cho chuỗi việc cần hoàn thành.
- Header sticky khi dài; cột hành động ở cuối, không rải nút trong mỗi ô.
- Hỗ trợ density nhưng mặc định row 52px.
- Trạng thái empty-after-filter đưa nút xóa lọc ngay tại chỗ.

### Form

- Label luôn hiện; placeholder chỉ là ví dụ.
- Help text trước lỗi; lỗi cụ thể dưới field và trong summary đầu trang.
- Điểm/trần điểm dùng tabular numerals; suffix rõ.
- Autosave hiển thị `Đã lưu lúc …`, `Đang lưu`, `Không thể lưu — thử lại`.

### Evidence

Mỗi evidence item có loại, tên, nguồn, người nộp, thời gian, trạng thái link/tệp và hành động xem. Link hỏng/không truy cập được là trạng thái hạng nhất, không phải toast thoáng qua.

## 4. Quy tắc hình ảnh mẫu

Ảnh imagegen chỉ được dùng để duyệt bố cục, mật độ và hierarchy. Text trong ảnh không phải source of truth. Sau duyệt, giao diện được code từ token và component thật; không cắt ảnh làm background.

Các prompt phải yêu cầu: desktop product UI, Vietnamese labels ngắn, sidebar 256px, one primary action, no gradients, no glass, no card mosaic, no decorative charts, no watermark/logo giả.
