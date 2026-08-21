# Khám phá tên và nhận diện sản phẩm

Ngày nghiên cứu: 15/08/2026  
Cập nhật quyết định: 20/08/2026
Trạng thái: **Neko Đoàn** đã được chủ dự án duyệt; bộ nguồn v1 nằm tại `docs/assets/brand/neko-doan-v1/`, các derivative chạy thật nằm tại `app/frontend/public/brand/neko-doan-v1/`.

> Phần so sánh phía dưới là lịch sử nghiên cứu cho tên cũ. Quyết định mới thay thế tên sản phẩm, không thay đổi chủ thể vận hành Thành đoàn Hải Phòng hoặc phạm vi nghiệp vụ.

## 1. Vấn đề cần giải quyết

Sản phẩm không chỉ là một "bảng điểm". Nó điều phối toàn bộ vòng đời chiến dịch: tiếp nhận tiêu chí, phân khối, giao việc, nộp minh chứng, tự chấm, thẩm định, giải trình, chốt kết quả, lưu vết và đối soát. Tên cần đủ rộng cho vòng đời này nhưng vẫn dễ nhớ với cán bộ Thành đoàn Hải Phòng.

SEO không đến từ logo đơn lẻ. Tên nhất quán, tiêu đề trang mô tả đúng nhu cầu tìm kiếm, nội dung công khai hữu ích, dữ liệu có cấu trúc, favicon ổn định và khả năng crawl mới là các tín hiệu chính. Khu vực nghiệp vụ có đăng nhập phải tiếp tục `noindex`; nếu sau này cần SEO, phải làm một lớp website công khai riêng.

## 2. Kiến trúc tên đề xuất

| Lớp | Nội dung đề xuất | Vai trò |
| --- | --- | --- |
| Tên sản phẩm/site | **Neko Đoàn** | Tên chính thức được chủ dự án chốt |
| Tên rút gọn | **Neko Đoàn** | Dùng nhất quán, không tạo thêm biệt danh |
| Mô tả sản phẩm | **Nền tảng điều hành chiến dịch thanh niên** | Giải nghĩa ngay lần đầu gặp |
| Chủ thể vận hành | **Thành đoàn Hải Phòng** | Xác lập nguồn chính thức, không trộn vào tên thương hiệu |
| Mẫu title công khai | `<Tên trang> · Neko Đoàn` | Nhất quán kết quả tìm kiếm |

**Neko Đoàn** là thương hiệu sản phẩm; **Thành đoàn Hải Phòng** là chủ thể vận hành. Hai lớp này phải xuất hiện riêng để không biến tên sản phẩm thành tên pháp nhân.

Tên không dùng các từ "hệ thống quản lý" hoặc "LMS" vì quá chung, khó nhớ và không phản ánh giá trị nghiệp vụ.

## 3. So sánh các phương án

Thang 1–5; điểm cao là tốt. Đây là đánh giá sản phẩm, chưa phải tra cứu nhãn hiệu pháp lý.

| Tiêu chí | Dấu Xanh Hải Phòng | Đoàn Số Hải Phòng | Minh Chứng Xanh |
| --- | ---: | ---: | ---: |
| Đủ rộng cho toàn vòng đời | 5 | 5 | 2 |
| Dễ nhớ và dễ gọi | 5 | 4 | 4 |
| Khác biệt so với tên mô tả chung | 5 | 2 | 4 |
| Liên hệ với minh chứng/truy vết | 5 | 2 | 5 |
| Không tạo cảm giác tự nhận là pháp nhân | 5 | 2 | 5 |
| Khả năng tạo biểu tượng 16 px | 5 | 4 | 3 |
| Tổng | **30** | 19 | 23 |

Kết luận lịch sử này đã được thay thế bởi quyết định **Neko Đoàn** ngày 20/08/2026.

## 4. Hệ nhận diện đề xuất

### Biểu tượng

Biểu tượng chính là **Neko Peek** của Neko Family: Neko màu ngà ấm nhìn ra từ chiếc đuôi graphite cuộn tròn. Chiếc đuôi là phần sở hữu được của silhouette, đồng thời gợi một workspace an toàn và liên tục. Không tạo pose thứ năm hoặc tô lại Neko theo khối/vai trò. Sky chỉ được dùng như tín hiệu trạng thái/luồng ngoài khuôn mặt.

Không dùng lại hoặc biến thể biểu trưng chính thức của Đoàn. Khi cần, biểu trưng cơ quan và logo sản phẩm đứng thành hai thực thể độc lập, có khoảng cách và nhãn vai trò rõ ràng.

### Màu

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `milk` | `#F5F0E6` | Thân Neko, chữ sáng |
| `cocoa` | `#2A2928` | Đuôi, mắt, chữ chính |
| `cocoa-lift` | `#454241` | Nếp đuôi phía trước |
| `mist` | `#E7E3DE` | Nền trung tính sáng |
| `sky` | `#BBDDF2` | Tín hiệu trạng thái/luồng có tiết chế |
| `product-blue` | `#0756C9` | Hành động chính trong UI, không tô lại Neko |

Mark chính dùng Milk/Cocoa/Cocoa Lift. Không gradient, glow, bóng đổ hoặc hiệu ứng kính trong SVG phát hành. Ảnh 3D mascot và ảnh concept chỉ dùng ở bề mặt cho phép hoặc cổng duyệt, không thay thế mark vector.

### Quy tắc thu nhỏ

- 16–24 px: chỉ dùng biểu tượng, bỏ chi tiết sóng thứ cấp nếu bị bết.
- Từ 32 px: biểu tượng đầy đủ.
- Lockup ngang: biểu tượng + `Neko Đoàn`; dòng `Thành đoàn Hải Phòng` chỉ dùng khi đủ rộng.
- Logo phải có bản một màu và bản đảo trắng.
- Wordmark cuối phải dựng bằng vector/chữ thật; không cắt chữ trực tiếp từ ảnh AI.

## 5. Tài sản chuẩn

Concept `docs/assets/brand/neko-doan-v1/concepts/neko-doan-workflow-accent-v1.png` được tạo bằng built-in imagegen để kiểm nghiệm hướng; quyết định cuối giữ Neko Peek chuẩn và chỉ dùng ý niệm Sky ở lockup/social card. Nguồn vector, ICO, PNG theo cỡ, preview, prompt và hash nằm trong cùng brand kit; script đồng bộ và gate chống drift nằm tại `scripts/brand/`. Không lấy ảnh AI làm logo runtime.

## 6. Kế hoạch SEO đúng phạm vi

### Khu vực đăng nhập

- Giữ `noindex, nofollow` cho màn hình đăng nhập và toàn bộ route nghiệp vụ.
- Không đưa dữ liệu chiến dịch, minh chứng, tài khoản hoặc kết quả nội bộ ra công khai.
- Logo chỉ cải thiện nhận biết và tính nhất quán, không phải đòn bẩy xếp hạng.

### Website công khai trong tương lai

- Homepage có một tên site nhất quán: `Neko Đoàn`.
- Dùng `WebSite`, `Organization` và `SoftwareApplication` structured data chỉ khi có URL public tuyệt đối, nội dung public tương ứng và thông tin pháp lý đã xác nhận.
- Tiêu đề trang ngắn, mô tả đúng nội dung; không nhồi từ khóa.
- Favicon vuông, URL ổn định, xuất các cỡ 48/96/144 và SVG.
- Logo có text alternative theo ngữ cảnh. Nếu logo nằm trong link về trang chủ, alt mô tả chức năng/trang đích.
- File ảnh có tên mô tả; ảnh nội dung có alt hữu ích, ảnh trang trí dùng alt rỗng.

Ví dụ dữ liệu có cấu trúc chỉ áp dụng khi có website công khai và tên đã được duyệt:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://<ten-mien-cong-khai>/",
  "name": "Neko Đoàn",
  "alternateName": ["Neko Doan"]
}
```

## 7. Cổng quyết định trước khi đưa vào ứng dụng

1. Chủ dự án duyệt tên và ngữ nghĩa.
2. Kiểm tra nhãn hiệu, tên miền và tài khoản mạng xã hội bằng quy trình pháp lý/chính thức; tìm kiếm web sơ bộ không thay thế bước này.
3. Xác nhận quy tắc đồng hiện với biểu trưng Thành đoàn/Đoàn TNCS Hồ Chí Minh.
4. Dựng SVG gốc và bộ favicon; kiểm thử tương phản, đơn sắc, nền sáng/tối và kích thước nhỏ. **Đã hoàn thành local.**
5. Đổi tên trong UI, metadata, manifest và tài liệu bằng một thay đổi có thể hồi quy. **Đã hoàn thành local.**
6. Chỉ xây website công khai/SEO khi có yêu cầu riêng; không mở index khu vực nghiệp vụ. **Vẫn là cổng ngoài phạm vi.**

## 8. Nguồn chuẩn đã đối chiếu

- Google Search Central — Site names: https://developers.google.com/search/docs/appearance/site-names
- Google Search Central — Title links: https://developers.google.com/search/docs/appearance/title-link
- Google Search Central — Favicons: https://developers.google.com/search/docs/appearance/favicon-in-search
- Google Search Central — Image SEO: https://developers.google.com/search/docs/appearance/google-images
- W3C WAI — Image text alternatives: https://www.w3.org/WAI/tutorials/images/
- Cổng thông tin Trung ương Đoàn — ví dụ quy chuẩn sử dụng nhận diện theo công bố chính thức: https://doanthanhnien.vn/chi-tiet/cong-bo-bieu-trung-ky-niem-65-nam-ngay-truyen-thong-hoi-lhtn-viet-nam-37943

