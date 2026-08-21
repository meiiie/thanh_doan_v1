# Neko Interface Icons v1

Bộ glyph giao diện tối giản dùng cùng nhận diện Neko Family. Hình học không được tự vẽ lại: ba glyph đầu tiên được nhập nguyên bản từ **Phosphor Regular 2.1.1**. Hệ hình học có tỷ lệ nét tương đương 1.5 px khi hiển thị ở 24 px, đầu nét bo và silhouette rõ ở kích thước nhỏ.

## Quy tắc sử dụng

- Icon chỉ mô tả thao tác; Neko Peek tiếp tục là tài sản thương hiệu, không biến thành icon chức năng.
- Kích thước hiển thị mặc định 20 px trong vùng bấm 48 × 48 px.
- Icon-only button luôn phải có accessible name và tooltip; không dùng màu đơn độc để truyền đạt trạng thái.
- `eye` biểu thị hành động hiện mật khẩu; sau khi bật, đổi thành `eye-slash` để biểu thị hành động ẩn mật khẩu.
- Không trộn stroke weight hoặc một bộ icon thứ hai trong cùng một control group.

## Nguồn và giấy phép

- Upstream: `@phosphor-icons/core` npm package 2.1.1.
- Trang chính thức: https://phosphoricons.com/
- Kho nguồn: https://github.com/phosphor-icons/core
- Giấy phép: MIT, lưu tại `LICENSE.phosphor.txt` và được phát hành cùng các SVG runtime.
- Package integrity tại thời điểm nhập: `sha512-v4ARvrip4qBCImOE5rmPUylOEK4iiED9ZyKjcvzuezqMaiRASCHKcRIuvvxL/twvLpkfnEODCOJp5dM4eZilxQ==`.

`manifest.json` khóa tên, số byte và SHA-256 của từng glyph. Runtime chỉ nhận các file đã chọn tại `app/frontend/public/icons/neko-interface-v1/`.
