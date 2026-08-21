# Cổng staging và UAT

Repository không tự deploy. Cổng này định nghĩa bằng chứng bắt buộc để một release candidate rời local; việc cấp môi trường, dữ liệu thật và ký UAT thuộc người vận hành/khách hàng.

## Staging tương đương production

- Dùng đúng image digest đã qua CI, PostgreSQL major 18, Flyway migrations và cấu hình proxy như production.
- Chỉ public HTTPS frontend; backend, management và database ở mạng riêng.
- Secret đến từ secret manager/config tree, không nằm trong image, Git, log hoặc command history.
- Bật metrics/log correlation, retention, cảnh báo readiness và ngân sách p95 đã ghi trong `CapacityLoadIntegrationTest`.
- Gắn đích backup ngoài máy ứng dụng và chạy `backup-offhost-drill.ps1`; lưu JSON report cùng release evidence.
- Chạy `staging-smoke.ps1 -BaseUrl https://staging.example` và toàn bộ browser E2E với `ADMIN_BASE_URL` trỏ vào staging.
- Chạy image scan, Java SBOM scan, dependency audit và `check-licenses.mjs` trên đúng commit/image digest.

## UAT nghiệp vụ

Đại diện Superadmin, Admin Hải Phòng, đơn vị khối và Tổ thẩm định phải tự hoàn thành: ban hành bảng điểm; phân khối/tổ/cán bộ; nhập điểm và link minh chứng; trả hồ sơ/giải trình/vòng 2; bốn mắt phê duyệt; snapshot và export đối soát. Biên bản phải ghi actor, vai trò, campaign, build digest, thời điểm, thiết bị/trình duyệt, kết quả từng kịch bản và sai lệch được chấp nhận.

UAT accessibility bổ sung keyboard-only ở 390/1024/1512 px, zoom 200%, screen reader và axe không có vi phạm serious/critical. Người ký xác nhận ngôn ngữ, công thức điểm, trần điểm thưởng và workbook export đối chiếu được với nguồn.

## Quy tắc ra quyết định

Không có URL staging, report restore off-host, số đo p95 trên hạ tầng tương đương, image digest và chữ ký UAT thì trạng thái chỉ là **local release-ready**, không phải production-ready. Production deploy luôn cần yêu cầu riêng của chủ dự án.
