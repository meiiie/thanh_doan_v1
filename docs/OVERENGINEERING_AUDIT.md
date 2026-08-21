# Ponytail audit — 20/08/2026

delete: Xóa sản phẩm React/Vinext/Cloudflare song song; Angular/Spring đã là runtime, compose và CI duy nhất. [web/]
delete: Không version-control 42 ảnh browser sinh lại được; e2e là bằng chứng thực thi, ảnh chỉ là đầu ra tạm. [app/frontend/artifacts/]
delete: Xóa mockup, ảnh concept và ảnh audit do AI/browser sinh; giữ token, quyết định và SVG runtime đã duyệt. [lab/mockups/, lab/audits/, lab/brand/concepts/]
delete: Xóa specimen và kho prompt tiền-scaffold; ứng dụng Angular hiện hành mới là mẫu có thể thực thi. [lab/specimen/, lab/prompts/]
shrink: Hợp nhất 3.909 dòng tài liệu Lab chồng lấn thành nguồn BA, ADR, UX spec, runbook và tiến độ hiện hành; không để tài liệu cũ tự nhận là trạng thái hiện tại. [lab/]
shrink: Giới hạn stylesheet toàn cục vào token và primitive; thống nhất breakpoint thay vì duy trì lưới responsive riêng ở từng feature. [app/frontend/src/styles.css, app/frontend/src/app/**/*.css]
shrink: Dùng một tập DTO biên được kiểm tra từ OpenAPI thay cho interface HTTP lặp lại bên trong từng page; page chỉ giữ view model riêng. [app/contracts/openapi.yaml, app/frontend/src/app/]
yagni: Bỏ tuyên bố “contract-first/client generated” nếu OpenAPI vẫn không có schema đầy đủ và không tham gia CI; hoặc biến nó thành contract thật trước khi thêm endpoint. [lab/PRODUCT_ARCHITECTURE.md, app/contracts/openapi.yaml]
shrink: Tách các page 300–450 dòng theo hành vi có tên, không theo lớp kỹ thuật chung; không thêm base component, facade hoặc generic repository. [app/frontend/src/app/admin/pages/accounts.page.ts, app/frontend/src/app/features/scorecard/scorecard-catalog.page.ts]
shrink: Chia repository JDBC 270–350 dòng theo use case/query được đo, giữ SQL trực tiếp và transaction hiện có; không dựng interface-per-class. [app/backend/src/main/java/vn/haiphong/campaign/**/infrastructure/]

net: -20.152 dòng đã cắt, -26 dependency trực tiếp đã cắt; khoảng -2.000 dòng tài liệu/CSS trùng lặp còn có thể giảm sau khi khóa acceptance.
