# BA — Phân tầng Superadmin và nhiều Admin chiến dịch

> Cập nhật 14/08/2026: phần giới hạn Superadmin trong tài liệu này đã bị thay thế bởi `D-2026-08-14-20`. Superadmin hiện có toàn bộ capability/scope; các giới hạn audit, snapshot bất biến và bốn mắt vẫn giữ nguyên.

Ngày chốt prototype: 14/08/2026  
Phạm vi: information architecture và fixture local; chưa phải authorization production.

## 1. Vấn đề

Prototype trước đây dùng một nhãn `Quản trị hệ thống` cho cả hai công việc khác nhau:

1. duy trì nền tảng, tài khoản, tích hợp, bảo mật và sao lưu;
2. điều hành một chiến dịch, cấu hình bảng điểm, phân công và nhận kết quả.

Nếu giữ chung, mọi Admin chiến dịch có vẻ như được quyền vận hành toàn hệ thống; đồng thời một quản trị viên hạ tầng có vẻ như được quyền sửa nghiệp vụ chấm điểm. Cả hai suy luận đều sai.

## 2. Mô hình vai trò và phạm vi

| Chủ thể | Phạm vi bắt buộc | Được làm | Không mặc nhiên được làm |
| --- | --- | --- | --- |
| **Superadmin hệ thống** | Toàn hệ thống | tạo/đóng không gian chiến dịch; quản lý tổ chức, tài khoản và grant; vận hành tích hợp, bảo mật, sao lưu | sửa điểm, chấm hồ sơ, ghi đè kết quả hoặc ban hành thay Admin chiến dịch |
| **Admin chiến dịch** | Một hoặc nhiều `campaignId` | cấu hình bảng điểm/phạm vi; phân công Tổ/cán bộ; theo dõi hồ sơ; nhận kết quả; thực hiện quyền nâng cao được cấp riêng | tài khoản toàn hệ thống, tích hợp, nhật ký bảo mật, sao lưu, chiến dịch ngoài grant |
| **Tổ trưởng/Cán bộ phụ trách** | campaign + team + assignment | đọc minh chứng và ghi quyết định trong hạng mục được giao | cấu hình bảng điểm, quyền hệ thống, hồ sơ ngoài assignment |
| **Tài khoản đơn vị** | campaign + organization | tự chấm, nhập minh chứng, giải trình trong hồ sơ của đơn vị | hồ sơ đơn vị khác, điểm thẩm định, cấu hình chiến dịch |

Bốn khối tiếp tục là phạm vi tổ chức, không phải bốn role mới.

## 3. Nhiều Admin trong một chiến dịch

Một chiến dịch có thể có nhiều Admin. Không lưu `campaign.adminId` duy nhất; dùng grant nhiều–nhiều:

`CampaignAdminGrant(accountId, campaignId, capabilities, validFrom, validUntil, grantedBy)`

Các capability đặc quyền như `campaign.publish`, `submission.reopen`, `assignment.override` được cấp rõ ràng; không suy ra chỉ từ nhãn “Admin”. Với vertical slice hiện tại, ba fixture Admin cùng nhìn thấy TNTN Hè 2026 nhưng mọi hành động vẫn phải mang `actorAccountId` riêng.

Khi hai Admin cùng sửa một draft, backend phải kiểm tra version/ETag và từ chối ghi đè im lặng. Business write và AuditRecord phải cùng transaction. Thu hồi grant không được xóa tên người đã thực hiện hành động lịch sử.

## 4. Context và điều hướng

### Superadmin — `/superadmin`

```text
Tổng quan hệ thống

NỀN TẢNG
  Danh mục chiến dịch
  Cơ cấu tổ chức
  Tài khoản & quyền

VẬN HÀNH HỆ THỐNG
  Tích hợp
  Nhật ký bảo mật
  Sao lưu & phục hồi
```

### Admin chiến dịch — `/admin`

```text
Chiến dịch được giao

ĐIỀU HÀNH CHIẾN DỊCH
  Bảng điểm & phân công
  Kết quả thẩm định
```

Sidebar không hiển thị một bức tường chức năng bị vô hiệu hóa. Profile luôn ghi vai trò và scope đang hoạt động. Liên kết đổi góc nhìn hiện tại chỉ là công cụ duyệt local, không phải chức năng impersonation production.

## 5. Authorization production

1. Server lấy tài khoản và grant từ phiên xác thực; không nhận role/scope do frontend gửi lên rồi tin trực tiếp.
2. Mọi request nghiệp vụ chứa resource ID và được kiểm tra `campaignId + organization/team/assignment` theo deny-by-default.
3. Một người có thể đồng thời có grant Superadmin và Admin chiến dịch, nhưng phải chọn context; quyền không tự hợp nhất thành “được làm mọi thứ”.
4. Superadmin cấp/thu hồi grant; không được impersonate hoặc sửa quyết định thay người khác mà không có cơ chế khẩn cấp riêng, lý do và audit.
5. Snapshot bảng điểm đã ban hành và kết quả đã chốt tiếp tục bất biến.

## 6. Acceptance của vertical slice local

- `/superadmin/overview` hiển thị `Superadmin hệ thống · Toàn hệ thống` và không có liên kết Bảng điểm/Kết quả thẩm định trong sidebar.
- `/admin/campaigns` hiển thị `Admin chiến dịch · TNTN Hè 2026`, chỉ một chiến dịch thuộc grant và không có nút tạo chiến dịch.
- Sidebar Admin chiến dịch không có Tài khoản, Tích hợp, Nhật ký bảo mật hoặc Sao lưu.
- `/superadmin/accounts` có một Superadmin và ba Admin chiến dịch; từng Admin giữ tên tài khoản riêng và scope chiến dịch cụ thể.
- Các route cũ `/admin/accounts`, `/admin/security-log`… chuyển về không gian Superadmin để không làm gãy bookmark local.
- Harness desktop/tablet/mobile vẫn đạt và các route nghiệp vụ Tổ/Đơn vị không đổi.

## 7. Discovery còn mở

1. `campaign.publish` cần một Admin hay cơ chế bốn mắt hai người?
2. Admin có được mở lại hồ sơ đơn vị hay chỉ đề nghị người có thẩm quyền phê duyệt?
3. Grant theo toàn chiến dịch là đủ hay cần scope theo khối/hạng mục?
4. Có vai trò chỉ-đọc dành cho lãnh đạo theo dõi mà không được can thiệp không?
5. Khi Admin vắng mặt, ủy quyền có ngày hết hạn và yêu cầu xác nhận thế nào?
