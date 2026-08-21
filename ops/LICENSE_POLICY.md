# Chính sách giấy phép dependency

Gate `node ops/check-licenses.mjs` đọc trực tiếp hai `package-lock.json` và CycloneDX SBOM do Maven tạo. Bản phát hành bị chặn khi dependency thiếu giấy phép hoặc không thuộc allowlist.

Allowlist hiện gồm MIT/ISC/BSD/Apache-2.0, CC0/CC-BY-4.0/Unlicense, MPL-2.0, EPL-1.0/2.0, Python-2.0, BlueOak và GPL-2.0 có Classpath Exception. CC-BY-4.0 chỉ hiện diện ở dữ liệu tương thích trình duyệt `caniuse-lite`; nghĩa vụ attribution phải được giữ trong SBOM/release notices. Biểu thức `OR` được chấp nhận khi dự án có thể chọn ít nhất một nhánh đã duyệt; `AND` chỉ đạt khi mọi nhánh đều đã duyệt.

AGPL, SSPL, BUSL, Elastic License, Commons Clause và GPL không có ngoại lệ không được tự động chấp nhận. Muốn thay allowlist phải có rà soát pháp lý, ADR nêu phạm vi phân phối và một thay đổi riêng có thể review.

Gate này kiểm soát policy, không thay thế kiểm tra CVE, SBOM provenance hoặc tư vấn pháp lý cho bản phát hành thương mại.
