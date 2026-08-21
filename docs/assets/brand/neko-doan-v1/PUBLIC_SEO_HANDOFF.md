# Cổng SEO cho lớp public tương lai

Ứng dụng hiện tại là cổng nghiệp vụ có xác thực; không có trang public hoặc tên miền canonical đã được duyệt. Vì vậy cấu hình đúng hiện tại là chặn index. Tài liệu này ghi điều kiện mở SEO, không phải chỉ dẫn triển khai ngay.

## Dữ liệu còn thiếu

1. Origin HTTPS public chính thức.
2. Pháp nhân/chủ thể được phép công bố, địa chỉ và kênh liên hệ đã xác nhận.
3. Nội dung homepage public thật sự nhìn thấy được và không chứa dữ liệu chiến dịch nội bộ.
4. Chính sách tên miền, redirect, sitemap, consent/analytics và quyền sử dụng logo cơ quan.

## Schema phù hợp sau khi đủ dữ liệu

- `WebSite`: tên site và origin public.
- `Organization`: chỉ dùng thông tin pháp lý/kênh công khai đã xác nhận; logo phải là URL tuyệt đối.
- `SoftwareApplication`: mô tả ứng dụng web; không tạo `Offer`, `AggregateRating`, giá hoặc review giả.
- `BreadcrumbList`: chỉ cho các route public có breadcrumb nhìn thấy được.

Không dùng FAQ/HowTo schema nếu nội dung hỏi đáp hoặc hướng dẫn không xuất hiện trên trang. Mọi URL phải tuyệt đối, dữ liệu cấu trúc phải trùng nội dung hiển thị và phải qua Schema.org Validator/Google Rich Results Test trên staging public.

## Metadata hiện tại

- Title fallback: `Điều hành chiến dịch thanh niên Hải Phòng · Neko Đoàn` — 53 ký tự.
- Description: 158 ký tự, mô tả đúng phạm vi phân công–minh chứng–thẩm định–đối soát.
- Social card: `social/neko-doan-social-card.png`, 1200×630.
- Không có canonical, sitemap hoặc JSON-LD vì chưa có origin public hợp lệ.
