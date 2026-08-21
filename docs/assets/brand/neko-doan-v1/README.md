# Neko Đoàn brand kit v1

Trạng thái: **đã tích hợp local**, ngày 20/08/2026.

Đây là nhánh sản phẩm của Neko Family dành cho nền tảng điều hành chiến dịch thanh niên. `Neko Peek` vẫn là dấu hiệu nhận biết chính; tên sản phẩm là **Neko Đoàn**; **Thành đoàn Hải Phòng** là chủ thể vận hành và không bị nhập vào tên thương hiệu.

## Cấu trúc

```text
neko-doan-v1/
|-- README.md
|-- BRAND_SYSTEM.md
|-- PROMPTS.md
|-- manifest.json
|-- concepts/     Ảnh imagegen dùng để ra quyết định, không phát hành
|-- logo/         SVG chuẩn, ICO, master và PNG theo kích thước
|-- previews/     Ảnh kiểm tra light/dark/lockup
`-- social/       Thẻ chia sẻ SVG + PNG 1200×630
```

Tài sản chạy thật được đồng bộ có chọn lọc sang `app/frontend/public/brand/neko-doan-v1/`. Chạy:

```powershell
python .\scripts\brand\sync_neko_doan_brand.py
node .\scripts\brand\verify-neko-doan-brand.mjs
```

`concepts/neko-doan-workflow-accent-v1.png` được tạo bằng built-in `imagegen` từ ảnh tổng quan Neko Family. Concept gợi ý một quỹ đạo Sky cho tính liên tục của luồng công việc, nhưng bản logo phát hành giữ nguyên Neko Peek; Sky chỉ là điểm nhấn ngữ cảnh ở lockup và social card.

## Bề mặt xác thực đã chốt

Login local/UAT dùng Neko Peek 64 px ở tâm tác vụ và lockup nhỏ tại product header. Neko chỉ đảm nhiệm nhận diện; thao tác sửa/hiện/ẩn dùng bộ trung tính `docs/assets/icons/neko-interface-v1/`, không vẽ tai, mắt hoặc đuôi Neko thành control. Bề mặt xác thực giữ Milk/Cocoa, khoảng trắng lớn, một CTA chính và không thêm minh họa/pose mới.

Trạng thái nhận diện và UX login được chốt ngày 20/08/2026. Metadata và toàn bộ route nghiệp vụ tiếp tục `noindex`; nhận diện không được đưa vào domain logic, role hoặc authorization. Bằng chứng so sánh nằm tại `design-qa.md`, quyết định kỹ thuật tại `lab/modules/IDENTITY_ACCESS.md`.

## Nguồn

Hình học Neko Peek và các bản PNG/ICO được kế thừa từ bộ Neko Family v1 do chủ dự án cung cấp tại `E:/Sach/Sua/NekoChill/wiii/docs/assets/brand/neko-family-v1`. Việc nhập tài sản là bản sao có kiểm soát; dự án Neko Đoàn không phụ thuộc runtime vào thư mục nguồn đó.
