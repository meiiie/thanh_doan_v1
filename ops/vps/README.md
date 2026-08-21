# Gói vận hành Neko Đoàn trên một VPS

Gói này chuẩn bị một bản phát hành có thể lặp lại trên **một VPS Linux**. Repository không tự deploy. Người vận hành chỉ chạy `deploy.sh` sau khi image, DNS, secret, backup và cửa sổ thay đổi đã được phê duyệt.

## Kiến trúc

```text
Internet
   |
   | 80/tcp, 443/tcp+udp
   v
Caddy (TLS + access log)
   |
   v
Nginx/Angular ----> Spring Boot ----> PostgreSQL
     edge             application       application
                                         (internal)
```

- Chỉ Caddy công khai cổng. PostgreSQL, backend, management endpoint và frontend không publish cổng host.
- Caddy tự cấp/gia hạn TLS; dữ liệu CA được giữ trong named volume.
- Backend và frontend chạy non-root, read-only filesystem, `no-new-privileges`, drop toàn bộ Linux capabilities và có giới hạn CPU/RAM/PID.
- Release image phải dùng `@sha256`; VPS không build source và không dùng `latest`.
- Mật khẩu nằm ngoài repository và được mount bằng Docker secrets/config tree.
- Đây là mô hình single-node. Mất VPS vẫn là mất dịch vụ; backup mã hóa off-host và restore drill là cổng bắt buộc.
- Chỉ chạy một backend replica vì session hiện lưu trong bộ nhớ tiến trình.

## Baseline VPS

Cho pilot nội bộ: 2 vCPU, 4 GiB RAM, 50 GiB SSD. Cho vận hành ổn định và có dư địa: 4 vCPU, 8 GiB RAM, 80+ GiB SSD. Dùng bản Linux LTS còn hỗ trợ, Docker Engine và Compose plugin hiện hành.

Host baseline:

- SSH key only; tắt password login và root login.
- Firewall chỉ cho SSH từ dải quản trị, 80/tcp, 443/tcp và 443/udp. Không mở 5432, 8080, 8081 hoặc 9090.
- Bật cập nhật bảo mật tự động và đồng bộ thời gian.
- Dùng một deployment user riêng. Quyền truy cập Docker socket tương đương quyền root, vì vậy không cấp cho tài khoản nghiệp vụ.
- Không cài control panel, database UI hoặc dịch vụ không cần thiết trên cùng host.

## Bố trí file trên host

```text
/opt/neko-doan/                         checkout release đã kiểm chứng
/etc/neko-doan/neko-doan.env            0640, cấu hình không nhạy cảm
/etc/neko-doan/secrets/                  0700
  CAMPAIGN_DB_PASSWORD                   0600
  APP_BOOTSTRAP_PASSWORD                 0600
/var/lib/neko-doan/releases/             manifest lần triển khai
/var/backups/neko-doan/                  backup local tạm thời
```

Sao chép `neko-doan.env.example` sang `/etc/neko-doan/neko-doan.env`, thay domain/email và bốn image digest. Không sao chép `.env`, `.tmp` hoặc credential local lên VPS.

Tạo secret không in ra terminal history:

```bash
sudo install -d -m 0700 /etc/neko-doan/secrets
sudo sh -c 'umask 077; openssl rand -base64 36 | tr -d "\n" > /etc/neko-doan/secrets/CAMPAIGN_DB_PASSWORD'
sudo sh -c 'umask 077; openssl rand -base64 36 | tr -d "\n" > /etc/neko-doan/secrets/APP_BOOTSTRAP_PASSWORD'
sudo chown -R neko-deploy:neko-deploy /etc/neko-doan
```

## Phát hành lần đầu

1. Trỏ A/AAAA record của domain về VPS; chờ DNS phân giải công khai.
2. Build, test, tạo SBOM và scan image trong CI. Push hai image ứng dụng vào registry; ghi digest đã duyệt vào env file.
3. Đăng nhập registry trên VPS bằng read-only deploy token.
4. Chỉ cho lần đầu, đặt `APP_BOOTSTRAP_ENABLED=true`, rồi chạy:

```bash
cd /opt/neko-doan
bash ./ops/vps/deploy.sh /etc/neko-doan/neko-doan.env --allow-bootstrap
```

5. Đăng nhập Superadmin, đổi mật khẩu khởi tạo và xác minh audit.
6. Đặt ngay `APP_BOOTSTRAP_ENABLED=false`, thay `APP_BOOTSTRAP_PASSWORD` bằng giá trị ngẫu nhiên mới không được bàn giao, rồi chạy lại `deploy.sh` không có cờ bootstrap.
7. Cài unit systemd trong `systemd/`, sau đó bật service và timer backup:

```bash
sudo install -d -m 0700 -o neko-deploy -g neko-deploy /var/backups/neko-doan
sudo install -m 0644 ops/vps/systemd/neko-doan.service /etc/systemd/system/
sudo install -m 0644 ops/vps/systemd/neko-doan-backup.service /etc/systemd/system/
sudo install -m 0644 ops/vps/systemd/neko-doan-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now neko-doan.service neko-doan-backup.timer
```

Script preflight từ chối domain giả, image tag mutable, secret rộng/quyền rộng, bootstrap bật nhầm và Compose làm lộ cổng nội bộ. Deploy chỉ thành công sau khi HTTPS, security headers, CSRF endpoint và HTTP→HTTPS smoke đều xanh.

## Nâng cấp và rollback

1. CI phải xanh; lưu SBOM, scan report và image digest theo release.
2. Chạy backup và xác minh off-host copy trước migration.
3. Chỉ đổi digest trong env file, rồi chạy `deploy.sh`.
4. Kiểm tra `releases/*-deployed.txt`, log JSON, login và một luồng đọc không phá hủy.
5. Rollback app bằng digest cũ. Không tự hạ schema; chỉ restore database sau phê duyệt dữ liệu và trong maintenance window.

## Backup, restore và off-host

`backup.sh` tạo PostgreSQL custom dump, kiểm tra archive, SHA-256 và metadata Flyway. Timer mặc định chạy hằng ngày. Sau mỗi backup, một công cụ đã phê duyệt (ví dụ restic với repository mã hóa) phải sao chép `dump + sha256 + meta` ra nơi khác VPS.

```bash
bash ./ops/vps/backup.sh /etc/neko-doan/neko-doan.env
bash ./ops/vps/restore-drill.sh /etc/neko-doan/neko-doan.env \
  /var/backups/neko-doan/neko-doan-YYYYMMDDTHHMMSSZ.dump
```

Không coi việc “có file backup” là đủ. Hàng tháng phải restore một bản lấy từ kho off-host, lưu report và đo RPO/RTO. Việc chọn kho off-host/KMS phụ thuộc nhà cung cấp VPS và chưa được tự động hóa trong repository này.

## Quan sát và sự cố

```bash
docker compose --env-file /etc/neko-doan/neko-doan.env \
  -f compose.yaml -f compose.vps.yaml ps
docker compose --env-file /etc/neko-doan/neko-doan.env \
  -f compose.yaml -f compose.vps.yaml logs --since 15m
```

Docker `local` log driver xoay vòng log container. Caddy ghi access log JSON ra stdout; backend ghi correlation ID. Probe `/readyz` đi xuyên qua Caddy → Nginx → Spring readiness → database và chỉ trả trạng thái, không trả component detail. VPS vẫn cần disk/CPU/RAM/uptime alert bằng hệ thống giám sát của nhà cung cấp hoặc agent được phê duyệt.

Không bật Cloudflare proxy mặc định. Nếu bật sau này, phải cấu hình trusted proxy theo dải IP hiện hành và test lại real client IP/rate limit; không tin mù quáng header do client gửi.

## Cổng go-live

- UAT được ký trên staging có cấu hình tương đương.
- Image digest, SBOM, vulnerability/license gate và release manifest đủ.
- DNS/TLS, firewall, least privilege và secret rotation được kiểm tra.
- Backup mã hóa off-host và restore drill từ chính bản off-host đạt RPO/RTO.
- Load baseline và alerting được đo trên hạ tầng thật.
- Có owner, maintenance window, incident contact và rollback decision maker.

Thiếu một cổng trên thì trạng thái vẫn là `VPS package ready`, không phải `production ready`.
