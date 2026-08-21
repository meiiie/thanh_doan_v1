# Bằng chứng readiness local — 20/08/2026

Phạm vi của biên bản này là release candidate local. Không có deploy production hoặc staging thật.

## Kết quả cổng tự động

- `scripts/check.ps1 -Browser`: PASS; backend 19 test, không skip, gồm PostgreSQL 18 migrations và tải 134 × 55; frontend 18 test/6 file, anti-slop lint, production build và browser accessibility/keyboard smoke; OpenAPI lint/generation drift và npm audits đều xanh.
- Kiến trúc: application không import infrastructure/web; infrastructure không dựng `*View`; ba ràng buộc được khóa bởi `ArchitectureBoundaryTest`.
- Contract: `app/contracts/openapi.yaml` là nguồn sinh `frontend/src/app/api/generated/openapi.ts`; thay đổi không tái sinh làm gate đỏ.
- Brand/SEO: Neko Family v1 có 27 file nguồn được khóa SHA-256; 11 derivative runtime qua byte/dimension drift gate. Favicon, web manifest, social card 1200×630, HTML robots, `robots.txt`, `X-Robots-Tag` và MIME `application/manifest+json` đều đạt.
- License: 519 component frontend, 34 component contract tools và 82 component Java qua allowlist trong `LICENSE_POLICY.md`.
- Performance PostgreSQL 18, dữ liệu 134 × 55: p50 22,14 ms; p95 31,31 ms; max 48,44 ms; phản hồi 38.377 byte; budget p95 250 ms.
- Trivy local trên image cuối `sha256:e4db737b1df005d64bddc059abdd834070cef6a4485764e26f33fd3b3cbe119c` (backend) và `sha256:4d1bfc4c3351d477f6a24cf26a61791e660939c59ad976059ec3babad0627cfb` (frontend): 0 HIGH/CRITICAL có bản vá; backend JAR cũng 0 finding trong cùng filter.
- HTTPS smoke `https://127.0.0.1:4319`: PASS cho health, Neko Family mark, security + robots headers, manifest MIME, anonymous session denial và browser accessibility/keyboard flow.
- Backup off-host adapter: dump `neko-doan-20260820-183058.dump`, SHA-256 `CDF9488EB4407C6955AA7B47F1648279F405F7DEF345808F716192A354DF02E9`; restore PostgreSQL cô lập PASS trong 3,38 giây, đối chiếu 55 dòng và Flyway V6. JSON report nằm ở đích ngoài workspace `E:\Sach\Sua\neko-doan-offhost-drill`.

## Kết luận trung thực

Các debt kỹ thuật nêu trong đợt đại cải tạo đã có gate thực thi: dependency direction, view-model coupling, OpenAPI DTO generation, frontend unit tests, file ownership, SBOM/image/license, restore và p95. Stack local HTTP và HTTPS đều đang chạy bằng tên Neko Đoàn.

Chưa thể gọi production-ready vì staging tương đương production, secret manager/KMS thật, đích backup nằm ngoài máy ứng dụng và UAT có chữ ký người dùng là tài nguyên/quyết định bên ngoài repository. Tiêu chí và lệnh smoke nằm trong `STAGING_UAT.md`; không được thay chúng bằng dữ liệu giả hoặc tự ký thay khách hàng.
