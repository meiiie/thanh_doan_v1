# Hệ nhận diện Neko Đoàn v1

## Kiến trúc thương hiệu

- **Neko Đoàn** là tên sản phẩm.
- **Neko Peek** là biểu tượng chính và phải giữ chiếc đuôi cuộn bảo vệ công việc.
- **Thành đoàn Hải Phòng** là chủ thể vận hành, luôn đứng ở lớp ngữ cảnh riêng.
- Các pose Mochi, Nap và Tilt chỉ biểu đạt trạng thái; không trở thành logo riêng.

## Ngữ nghĩa

Neko không đứng trên người dùng. Neko nhìn ra từ một không gian được chiếc đuôi bảo vệ: thân thiện, biết lắng nghe, sẵn sàng và đủ năng lực. Điều này phù hợp với công việc cần phối hợp, lưu vết và thẩm định hơn một biểu tượng quyền lực hoặc huy hiệu giả.

## Màu chuẩn

| Token | Giá trị | Vai trò |
| --- | --- | --- |
| Milk | `#F5F0E6` | Thân Neko, chữ sáng |
| Cocoa | `#2A2928` | Đuôi, mắt, mực chính |
| Cocoa Lift | `#454241` | Nếp đuôi phía trước |
| Mist | `#E7E3DE` | Nền trung tính sáng |
| Sky | `#BBDDF2` | Điểm nhấn trạng thái/luồng, không trang trí tràn lan |
| Product blue | `#0756C9` | Hành động chính của giao diện, không tô lại Neko |

## Quy tắc sử dụng

- Dùng mark màu trên nền sáng; dùng `mark-on-dark` trên nền tối; dùng mono dưới 24 px nếu bản màu bị bết.
- Khoảng trống tối thiểu quanh mark bằng bề rộng một mắt.
- Không thêm miệng, mũi, ria, lông, má hồng, đồng phục, huy hiệu, cờ, sao hoặc biểu trưng chính thức của Đoàn.
- Không đổi màu Neko theo vai trò, khối hay trạng thái nghiệp vụ.
- Ảnh mascot là trang trí thì dùng alt rỗng; trạng thái phải luôn có chữ kèm theo.
- Không lấy ảnh `imagegen` làm nguồn logo runtime; SVG và chữ thật là nguồn phát hành.

## SEO và quyền riêng tư

Ứng dụng hiện là cổng nội bộ có đăng nhập. Cấu hình chuẩn là `noindex`, `nofollow`, `noarchive`, `nosnippet`, `noimageindex`, `robots.txt` chặn toàn site và `X-Robots-Tag` tại reverse proxy. Không tạo sitemap, canonical giả hoặc JSON-LD có URL chưa tồn tại.

Thẻ Open Graph/Twitter và ảnh 1200×630 chỉ phục vụ nhận diện khi môi trường nội bộ có trình xem link; chúng không biến khu vực nghiệp vụ thành website công khai. Khi có tên miền công khai, phải tạo một lớp public riêng rồi mới thêm canonical tuyệt đối, `WebSite`/`Organization`/`SoftwareApplication` schema và sitemap.
