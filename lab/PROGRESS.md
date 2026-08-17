# Tiến độ dự án local

Cập nhật: 15/08/2026  
Trạng thái: lát cắt vòng đời chấm điểm đầy đủ đã được hiện thực; đang ở cổng kiểm định local, chưa deploy và chưa gọi là vận hành production.

## Đã hiện thực

- Nhận diện local **Dấu Xanh Hải Phòng**: SVG hai màu, favicon, metadata, đăng nhập và shell đa vai trò; khu vực nghiệp vụ tiếp tục `noindex`.
- UX refinement: login lưới 1040 px bất đối xứng, hierarchy KPI theo nhóm, typography floor 12 px, dense control 40 px và active indicator không phụ thuộc riêng vào màu.
- Đăng nhập/logout bằng session server, CSRF, đổi mật khẩu lần đầu, timeout và deny-by-default trên từng resource scope.
- Superadmin có toàn quyền; nhiều Admin có quyền theo capability/scope; Unit và Reviewer chỉ thấy công việc thuộc phạm vi.
- Catalog workbook có nguồn: 27 hạng mục, 55 dòng, 83 điểm cơ bản, 69 điểm thưởng thô, trần 25 và SHA-256 provenance.
- Phân công khối/tổ/cán bộ; nộp điểm tự chấm và link minh chứng; trả hồ sơ, sửa và nộp lại.
- Chấm vòng 1; giải trình dòng bị giảm; chấm vòng 2 với toàn bộ ngữ cảnh.
- Snapshot cuối bất biến; chuẩn bị và phê duyệt bởi hai actor khác nhau; công bố; export Excel đối soát.
- UI theo vai trò cho Admin, Unit, Reviewer và Superadmin; kết quả cập nhật trong workbench bảng điểm.
- Migration Flyway V6, audit cùng transaction, optimistic version và idempotency cho lệnh không lặp.
- Kiểm thử tải 134 × 55, axe WCAG/keyboard smoke, HTTPS local + Docker secrets và diễn tập backup/restore cô lập.

## Dữ liệu runtime

Seed runtime chỉ chứa chiến dịch, catalog bảng điểm, bốn khối và số lượng đơn vị có nguồn từ tài liệu khách hàng. Không seed tên cán bộ, tên đơn vị, điểm, minh chứng, quyết định hay kết quả giả. Dữ liệu đầy đủ trong integration/load test chỉ tồn tại ở test scope.

## Cổng trước production

1. Khách hàng cung cấp và ký xác nhận danh sách thật của 134 đơn vị, tổ theo dõi, cán bộ và ma trận phân công.
2. UAT có người dùng thật bằng bàn phím và screen reader; xác nhận từ ngữ, công thức và mẫu Excel đối soát.
3. Cấp domain/chứng thư CA, secret manager/KMS, retention policy và đích backup thật ngoài máy ứng dụng.
4. Chạy performance/security test trên staging có cấu hình tương đương production, diễn tập phục hồi từ đích từ xa và ký biên bản RPO/RTO.
5. Chỉ deploy khi người dùng ra quyết định riêng; repository hiện không có hành động deploy.

Chi tiết acceptance và lệnh tái kiểm tra nằm tại `IMPLEMENTATION_ACCEPTANCE.md` và `../ops/RUNBOOK.md`.
