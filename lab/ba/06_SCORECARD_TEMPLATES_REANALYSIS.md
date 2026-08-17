# Tái phân tích `scorecard-templates` — nguồn, công việc và lát cắt UX đúng

Ngày đối soát: 13/08/2026  
Phạm vi: Admin Hải Phòng · `/admin/scorecard-templates` · local-only  
Trạng thái: đặc tả BA/UX có bằng chứng; các điểm P0 chưa phải quyết định khách hàng đã ký.

> Cập nhật quyết định ngày 13/08/2026: chủ sản phẩm yêu cầu bỏ luồng upload khỏi lát cắt đầu tiên. Workbook được đội phát triển đọc thủ công, chuẩn hóa thành fixture cố định và chuyển thẳng hiểu biết nghiệp vụ lên web. Xem mục 13; mục 12 được giữ để truy vết quyết định cũ nhưng không còn là hướng triển khai hiện hành.

## 1. Kết luận điều hành

Màn hiện tại đang gộp ba công việc khác nhau thành một bảng: **tiếp nhận nguồn**, **xác nhận dữ liệu**, và **phân công tổ/cán bộ**. Đây là nguyên nhân chính khiến giao diện dù đã gọn hơn vẫn chưa hài hòa: mỗi hàng vừa phải giải thích tiêu chí, vừa phải cảnh báo nguồn, vừa phải chứa hai ô chọn.

Lát cắt đúng tiếp theo không phải tiếp tục thu nhỏ component. Route này cần trở thành một workbench có năm giai đoạn, nhưng trước mắt chỉ hoàn thiện hai giai đoạn đầu:

```text
Tiếp nhận → Kiểm tra dữ liệu → Phạm vi áp dụng → Phân công → Rà soát & ban hành
     ^              ^
     └──── phạm vi bản local kế tiếp ────┘
```

**Quyết định UX đề xuất:** sau khi tải file, hiển thị một bảng đọc–đối soát 27 hạng mục. Không đặt dropdown Tổ/Cán bộ trong bảng này. Phân công là bước riêng sau khi Admin đã xác nhận danh mục và phạm vi áp dụng.

## 2. Nguồn đã kiểm chứng

### 2.1. Workbook

Nguồn: [`2. (ĐHCĐ) Bảng điểm Chiến dịch TNTN Hè 2026.xlsx`](<../../2. (ĐHCĐ) Bảng điểm Chiến dịch TNTN Hè 2026.xlsx>)  
SHA-256: `8D29B213907C00D5314C5D9B5FD27E4F09019F013B6A2D5A3DADE44361531653`

Đã kiểm tra độc lập bằng hai đường đọc:

- runtime spreadsheet chuẩn để đọc workbook, công thức, style và render hai sheet;
- OOXML/openpyxl để kiểm tra dimension vật lý, shared formula, freeze pane, merge, protection và data validation.

Không sửa hoặc xuất lại workbook nguồn.

### 2.2. Tài liệu nghiệp vụ

Nguồn: [`duananhCuong.pdf`](../../duananhCuong.pdf)  
SHA-256: `ACEF678B78A5E1F6E795594E8978EDCB7EC1FA8BD793E851294B5F289677031F`

PDF dài 4 trang, mô tả ba vai trò, phạm vi 134 đơn vị, phân quyền chấm theo tiêu chí và vòng đời năm bước. Đây là tài liệu phân tích yêu cầu, không phải văn bản chỉ đạo gốc có số/ký hiệu/cơ quan ban hành.

## 3. Workbook thực chất là gì?

Workbook không phải danh mục Trung ương trung tính vừa được chuyển xuống. Nội dung đã mang dấu vết địa phương hóa của Hải Phòng:

- tên bảng dành riêng cho khối `Đại học, Cao đẳng`;
- nhiều điều kiện nhắc trực tiếp `Thành đoàn tổ chức`, `phân bổ của Thành đoàn`, các cuộc thi/hoạt động tại Hải Phòng;
- đã có mã tổ `PT`, `TTNTH`, `TG`, `TCKT`, `VP` và tên cán bộ cụ thể;
- đã có cấu trúc tự chấm, được chấm, minh chứng, lý do trừ và công thức xếp loại.

Vì vậy, mô tả đúng là:

> **Biểu mẫu điểm ĐH/CĐ đã được Hải Phòng cụ thể hóa và từng dùng như phiếu phân công/chấm điểm**, không phải văn bản Trung ương nguyên bản.

Hệ quả:

1. UI không được ghi chắc chắn “file do Trung ương chuyển” nếu chưa có metadata chứng minh nguồn ban hành.
2. Tổ/cán bộ trong file không phải phân công có hiệu lực cho bản mới, nhưng cũng không nên bị xóa khỏi dấu vết nhập.
3. Import phải lưu chúng dưới dạng `gợi ý từ nguồn cũ`, rồi Admin xác nhận hoặc thay thế ở bước Phân công.
4. Muốn truy vết Trung ương → Hải Phòng thật sự, dự án còn thiếu văn bản/danh mục gốc từ Trung ương.

## 4. Bản đồ dữ liệu đã kiểm chứng

| Phần | Vùng nghĩa | Cấu trúc | Điểm |
| --- | --- | --- | ---: |
| Nội dung cơ bản | `Đại học, Cao đẳng!A1:L40` | 22 hạng mục, 30 dòng chấm | 83 |
| Điểm thưởng | `Điểm thưởng!A1:J30` | 5 nhóm, 25 dòng chấm | 69 điểm thô |
| Trần thưởng | `Đại học, Cao đẳng!A35:F35` | nhãn quy định, chưa được công thức cưỡng chế đầy đủ | 25 |
| Khung tổng hiển thị | `Đại học, Cao đẳng!A3:F3` | 83 + 25 | 108 |

### 4.1. 27 hàng không phải 27 đơn vị công việc phân công

- 27 là số **hạng mục cấp nhóm**: 22 cơ bản + 5 nhóm thưởng.
- 55 là số **dòng chấm nguyên tử**: 30 cơ bản + 25 thưởng.
- Mục `I.21` có 5 dòng cấu phần báo cáo.
- Mục `I.22` có 5 dòng do 5 tổ khác nhau theo dõi.
- Nhóm `II.4` có 6 dòng con và nhiều tổ/cán bộ khác nhau.
- Nhóm `II.1` có 10 slot hoạt động; `II.5` có 7 slot mô hình.

Do đó:

- bảng Tiếp nhận có thể dùng 27 hàng để quét nhanh;
- bảng Phân công phải hỗ trợ 55 dòng trách nhiệm hoặc cơ chế cha–con rõ ràng;
- thao tác “gán cả nhóm” chỉ là bulk action có xem trước, không được làm mất phân công khác nhau ở dòng con.

### 4.2. Các cột và actor

| Cột | Ý nghĩa nguồn | Chủ thể hợp lý | Hành vi TO-BE |
| --- | --- | --- | --- |
| A–C | mã, điều kiện, yêu cầu/cách chấm | nguồn + Admin địa phương hóa | read-only ở bước tiếp nhận |
| D | Tổ theo dõi | Chủ chiến dịch/Trưởng tổ | gợi ý nguồn; xác nhận ở bước Phân công |
| E | Phụ trách | Chủ chiến dịch/Trưởng tổ | gợi ý nguồn; chọn từ danh mục cán bộ có hiệu lực |
| F | Khung điểm | luật điểm | đối soát; sửa cần quyết định và audit |
| G | Tự chấm | đơn vị cơ sở | chỉ xuất hiện trong hồ sơ đơn vị |
| H | Được chấm | chuyên viên/Hội đồng | chỉ xuất hiện trong workbench chấm |
| I–J | tỷ lệ, xếp loại | scoring engine | giá trị dẫn xuất, không cho nhập |
| K | link minh chứng | đơn vị cơ sở | collection minh chứng, không chỉ một text cell |
| L | lý do trừ điểm | chuyên viên | bắt buộc khi điểm thẩm định thấp hơn tự chấm |

## 5. Những mâu thuẫn phải hiển thị như diagnostics

### P0-01 — Vùng vàng xung đột actor

Sheet chính tô vàng `H5:H34` và `K5:K34`, tức `Được chấm + Link minh chứng`, trong khi `Tự chấm` ở cột G không vàng. Sheet thưởng lại tô đúng `G + I + J`, và PDF nói đơn vị nhập `tự chấm + minh chứng + báo cáo`.

Không được dùng màu vàng làm quyền. Cần khách hàng xác nhận sheet chính bị tô lệch hay quy trình thật sự khác PDF.

### P0-02 — Điểm thưởng được chấm chưa cộng vào tổng

`H3 = H4 + H35`, nhưng `H35` không có công thức cộng `H36:H40`. Năm ô `H36:H40` nhận điểm từ sheet thưởng, song tổng được chấm có thể bỏ qua chúng.

### P0-03 — Trần 25 chưa được cưỡng chế

`G35 = SUM(G36:G40)`, không phải `MIN(25, …)`. Năm nhóm thưởng có tổng thô 69, nên file có thể tạo tổng tự chấm vượt khung 108.

### P0-04 — II.1 mâu thuẫn số hoạt động

Nội dung nói mỗi đơn vị đăng cai không quá 3 hoạt động, nhưng bảng có 10 dòng × 3 điểm và tổng công thức 30. Cần chốt tối đa 9 hay 30 điểm, hoặc 30 là sức chứa nhưng chỉ lấy 3 hoạt động hợp lệ.

### P0-05 — Công thức tỷ lệ và xếp loại

`I3 = H3/F4`, tức tổng được chấm chia 83 điểm cơ bản. Cách này có thể cho tỷ lệ trên 100% và phù hợp mô tả trong PDF, nhưng chỉ đúng khi P0-02/P0-03 được sửa và khách hàng xác nhận thưởng có vào tử số.

### P0-06 — Năm chiến dịch

Tên file, phần lớn nội dung và sheet thưởng ghi 2026, nhưng tiêu đề sheet chính còn ghi 2025. Import phải cảnh báo, không tự sửa im lặng.

### P0-07 — 4 khối hay 5 loại bảng

PDF liệt kê 4 khối với tổng 134 đơn vị nhưng đồng thời nói có 5 loại bảng điểm. Chưa được tạo khối thứ năm giả định hoặc ban hành ma trận phạm vi trước khi xác nhận.

## 6. Đối chiếu route hiện tại

| Hiện trạng | Đánh giá BA | Điều chỉnh cần thiết |
| --- | --- | --- |
| Upload `.xlsx` local và yêu cầu đúng hai sheet | đúng cho dialect ĐH/CĐ hiện tại | giữ |
| Đọc 22 hạng mục cơ bản + 5 nhóm thưởng | đúng ở cấp nhóm | giữ, đồng thời luôn hiển thị 55 dòng chấm |
| Bỏ toàn bộ Tổ/Phụ trách nguồn | mất provenance và gợi ý có giá trị | lưu `SourceAssignmentHint`, không áp dụng tự động |
| Mỗi hàng chứa dropdown Tổ và Cán bộ | làm quá sớm; trộn tiếp nhận với phân công | chuyển sang bước Phân công |
| Gán một tổ/cán bộ cho cả nhóm | nguy hiểm với I.22 và II.4 | bulk action có diff; cho phân công dòng con |
| Ghi “file do Trung ương chuyển” | chưa có bằng chứng; workbook mang nội dung địa phương | dùng “file nguồn” + metadata cơ quan ban hành |
| Nút `Xác nhận bản nháp` sau khi đủ 27 phân công | sai điều kiện hoàn tất của bước nhập | đổi thành `Xác nhận dữ liệu nhập`, không phụ thuộc phân công |
| Chỉ cảnh báo bằng khối thu gọn | khó biết cảnh báo thuộc hàng nào | trạng thái hàng + panel chi tiết + tổng diagnostics |

## 7. Kiến trúc công việc của route

### Giai đoạn 1 — Tiếp nhận

Mục tiêu: nhận đúng file và giữ bằng chứng nguồn.

- tên file, checksum, thời điểm nhập, người nhập;
- khối suy ra từ tên/sheet chỉ là gợi ý;
- không sửa file gốc;
- import lặp cùng checksum phải idempotent.

### Giai đoạn 2 — Kiểm tra dữ liệu

Mục tiêu: Admin xác nhận hệ thống đã hiểu đúng workbook.

- bảng 27 nhóm, expand thành 55 dòng;
- diagnostics gắn đúng hàng/rule;
- so sánh source text với bản chuẩn hóa;
- giữ Tổ/Phụ trách cũ như thông tin nguồn;
- chỉ tạo `ScorecardDraftVersion` khi không còn lỗi cấu trúc và Admin xác nhận.

### Giai đoạn 3 — Phạm vi áp dụng

Mục tiêu: quyết định hạng mục nào áp dụng cho khối/đơn vị nào.

- ma trận hạng mục × khối;
- ngoại lệ đơn vị là lớp riêng, có lý do;
- ĐH/CĐ được gợi ý từ workbook, không tự coi là quyết định ban hành;
- chặn hoàn tất khi còn câu hỏi 4/5 khối.

### Giai đoạn 4 — Phân công

Mục tiêu: giao trách nhiệm hướng dẫn và thẩm định.

- chọn tổ trước, cán bộ sau;
- nhìn thấy gợi ý cũ nhưng không tự kích hoạt;
- phân công đến dòng chấm khi nhóm có nhiều trách nhiệm;
- kiểm tra cán bộ còn hiệu lực và thuộc tổ;
- một dòng có thể cần reviewer chính và người phối hợp; chưa mặc định nếu khách hàng chưa chốt.

### Giai đoạn 5 — Rà soát & ban hành

Mục tiêu: phát hành snapshot bất biến cho đúng đơn vị.

- xem trước số hạng mục/đơn vị/người chấm;
- blocker P0 phải được xử lý hoặc có quyết định phê duyệt;
- ban hành tạo version bất biến; sửa sau đó tạo draft mới.

## 8. UX mục tiêu cho lát cắt kế tiếp

### 8.1. Thanh công việc

Một hàng duy nhất:

```text
[Tên file · ĐH/CĐ]  [27 hạng mục · 55 dòng]  [7 điểm cần xác nhận]  [Xác nhận dữ liệu nhập]
```

Không dùng KPI card, biểu đồ hoặc đoạn mô tả lớn. Chi tiết nguồn nằm trong disclosure/drawer.

### 8.2. Bảng mặc định

| Cột | Nội dung | Lý do |
| --- | --- | --- |
| STT/Mã | `01`, `I.21`, `II.4` | đối chiếu nhanh với Excel |
| Hạng mục | tiêu đề một–hai dòng | trọng tâm công việc |
| Phần | Cơ bản/Thưởng | phân loại |
| Điểm tối đa | số + nhãn thô/trần khi cần | tránh nhầm điểm |
| Dòng chấm | `1`, `5`, `10` | cho biết độ sâu |
| Nguồn phân công | `PT · Đ/c Trường`, `5 tổ`, `Chưa có` | giữ provenance; read-only |
| Kiểm tra | `Đủ`, `Cần xác nhận`, `Lỗi` | dẫn người dùng tới ngoại lệ |

Click một hàng mở inspector bên phải, không làm bảng nở cao. Inspector chứa nguyên văn yêu cầu, cách ghi nhận, minh chứng, dòng con, source sheet/range, phân công nguồn và diagnostics.

### 8.3. Quy tắc giảm nhiễu

- Nội dung nguyên văn dài nằm trong inspector; bảng chỉ giữ tiêu đề có nghĩa.
- Chỉ một màu nhấn cho chọn/điều hướng; vàng chỉ cho `Cần xác nhận`, đỏ cho lỗi chặn.
- Không dùng badge cho dữ liệu tĩnh nếu chữ thường đã đủ.
- Header và cột mã cố định; toàn trang không cuộn ngang.
- Bảng là vùng cuộn chính, nhưng inspector có URL/state để người dùng không mất lựa chọn.
- Trên mobile, chuyển thành danh sách hạng mục + inspector toàn màn hình; không ép bảng 7 cột.

## 9. Mô hình dữ liệu tối thiểu cho import

```text
WorkbookImport
  id, fileName, checksum, importedBy, importedAt, dialect, status

SourceScorecardGroup
  id, importId, section, sourceCode, title, displayOrder, sourceRange

SourceScoreLine
  id, groupId, lineCode, title, requirement, maxScore, sourceRange

SourceAssignmentHint
  scoreLineId, teamText, officerText, sourceRange

ImportDiagnostic
  importId, scoreLineId?, code, severity, message, sourceRange, resolution

ScorecardDraftVersion
  id, importId, version, status, confirmedBy, confirmedAt
```

Tọa độ Excel chỉ tồn tại ở adapter/provenance. Domain không lưu tiêu chí bằng khóa `H17` hoặc phụ thuộc màu ô.

## 10. Acceptance examples cho bước Tiếp nhận → Kiểm tra

1. Nhập workbook thật tạo 27 nhóm và 55 dòng chấm; không tạo hàng rỗng đến dòng 966/984.
2. Hiển thị 83 điểm cơ bản, 69 điểm thưởng thô, trần thưởng 25 và khung tổng 108 với nhãn không nhập nhằng.
3. I.21, I.22, II.1, II.4 và II.5 hiển thị đúng số dòng con.
4. I.22 hiển thị gợi ý từ 5 tổ khác nhau; không bị ghi đè bởi một dropdown cấp nhóm.
5. 74 ô Tổ/Phụ trách có dữ liệu được lưu làm provenance, không tự thành phân công có hiệu lực.
6. Sáu diagnostics P0 của workbook xuất hiện ở tổng quan và đúng hàng liên quan.
7. Xác nhận nhập không yêu cầu chọn tổ/cán bộ; chỉ yêu cầu không còn lỗi cấu trúc và Admin đã xem cảnh báo.
8. Chọn một hàng mở inspector mà không thay đổi vị trí cuộn của bảng.
9. Tìm theo mã, tiêu đề, yêu cầu và tên tổ/cán bộ nguồn cho kết quả đúng.
10. Reload local khôi phục import draft và lựa chọn hiện tại; không sửa workbook nguồn.

## 11. Các quyết định cần khách hàng trả lời trước khi sang Phân công

1. File này do đơn vị/cơ quan nào ban hành; có phải phiên bản Hải Phòng đã biên soạn từ văn bản Trung ương không?
2. Tổ/cán bộ đang có là phân công năm 2026, dữ liệu mẫu, hay phân công cũ cần thay toàn bộ?
3. Sheet chính, đơn vị nhập `G + K` hay `H + K` như vùng vàng?
4. Điểm thưởng được chấm có cộng vào tổng và bị cap 25 như thế nào?
5. II.1 tối đa 3 hoạt động/9 điểm hay 10 hoạt động/30 điểm?
6. Có chính xác 4 khối hay còn loại bảng/khối thứ năm?
7. Ai được xác nhận dữ liệu nhập, ai được phân phạm vi, ai được duyệt phân công?
8. Một dòng chấm có một người chính hay cho phép nhiều người đồng thẩm định?

## 12. Quyết định triển khai ngay sau phân tích

**Đã được thay thế bởi quyết định ở mục 13.**

Vertical slice kế tiếp của `/admin/scorecard-templates`:

1. giữ upload thật và parser dialect ĐH/CĐ;
2. bổ sung provenance cho source row và Tổ/Phụ trách nguồn;
3. bổ sung diagnostics có mã/severity/source range;
4. thay bảng phân công hiện tại bằng bảng Kiểm tra dữ liệu 27 nhóm + inspector 55 dòng;
5. đổi hành động kết thúc thành `Xác nhận dữ liệu nhập`;
6. chưa xây Phạm vi áp dụng/Phân công/Publish trong cùng lát cắt.

Đây là cách giảm giao diện mạnh nhất: không cố làm dropdown đẹp hơn, mà đưa dropdown ra khỏi bước chưa cần nó.

## 13. Quyết định đã triển khai — workbook cố định trước, tự động hóa sau

### 13.1. Lát cắt sản phẩm hiện hành

Route `/admin/scorecard-templates` không còn yêu cầu người dùng chọn file. Hệ thống mở trực tiếp **Bảng điểm khối Đại học, Cao đẳng 2026** đã được chuẩn hóa từ workbook khách hàng:

- 27 hạng mục cấp nhóm;
- 55 dòng chấm nguyên tử;
- 83 điểm cơ bản;
- 69 điểm thưởng thô, áp trần 25;
- tổng tối đa sau áp trần 108;
- 12 trường nghiệp vụ được tách theo 4 chủ thể nhập dữ liệu.

Upload/import tổng quát chỉ được xem xét sau khi mô hình cố định này được khách hàng nghiệm thu. Cách làm này giảm hai rủi ro: parser che giấu việc đội phát triển chưa hiểu nghiệp vụ, và người dùng phải học một luồng nhập file trước khi bảng điểm cốt lõi được xác nhận.

### 13.2. Bản đồ header đã đưa trực tiếp vào web

| Chủ thể | Header/field | Vị trí trên web |
| --- | --- | --- |
| Admin | Điều kiện chấm điểm; Yêu cầu/minh chứng/nguyên tắc; Tổ theo dõi; Phụ trách; Khung điểm | Cột trực tiếp trong bảng làm việc; Tổ/Phụ trách khởi tạo trống để Admin điền |
| Đơn vị | Tự chấm; Link minh chứng; Báo cáo tóm tắt kết quả | Ô nhập trực tiếp trên từng dòng chấm; báo cáo tóm tắt thuộc sheet `Điểm thưởng` |
| Tổ thẩm định | Được chấm; Lý do trừ điểm | Ô nhập trực tiếp trên từng dòng; lý do bắt buộc khi điểm giảm |
| Hệ thống | Tỉ lệ %; Xếp loại | Cột dẫn xuất trên sheet chính và phần tổng hợp trực tiếp phía trên bảng |

Phân công trên web để trống mặc định. `Tổ theo dõi` và `Phụ trách` ghi trong Excel chỉ là dữ liệu nguồn để đối chiếu, không tự trở thành phân công có hiệu lực.

Quyết định quan trọng: `Link minh chứng` là **dữ liệu người dùng phải nhập**, không phải nhãn hướng dẫn hay liên kết có sẵn. Mỗi dòng chấm của cả hai sheet có một ô URL độc lập; giá trị ban đầu để trống và được kiểm tra định dạng `http/https`.

### 13.3. Logic tính điểm đã mã hóa

```text
Điểm cơ bản = Σ Được chấm phần I, tối đa 83
Điểm thưởng áp dụng = min(Σ Được chấm phần II, 25)
Tổng điểm = Điểm cơ bản + Điểm thưởng áp dụng
Tỉ lệ = Tổng điểm / 83

>= 90%  → Có khả năng đạt XS
>= 70%  → Tiên tiến
>= 50%  → Hoàn thành
<  50%  → Không hoàn thành
```

Đây là quyết định tạm của prototype để sửa lỗ hổng `H35` và thực thi nhãn trần 25. Bốn bất nhất nguồn vẫn hiển thị công khai trong panel, không bị xem là quyết định khách hàng đã ký: sai năm tiêu đề, giới hạn II.1, thiếu tổng điểm thưởng được chấm và trần thưởng chưa thành công thức.

### 13.4. Bằng chứng thực thi

- Fixture chuẩn hóa: `app/frontend/src/app/admin/scorecard-2026.fixture.ts`.
- Mô hình và scoring engine: `app/frontend/src/app/admin/scorecard-2026.model.ts`.
- Kiểm thử bất biến: `app/frontend/src/app/admin/scorecard-2026.model.spec.ts`.
- Workbench UX: `app/frontend/src/app/admin/scorecard-workspace.component.*`.
- Harness đọc công thức: `scripts/analysis/inspect-scorecard-workbook.mjs`.
- Harness tái sinh fixture: `scripts/analysis/generate-scorecard-fixture.mjs`.
- Browser acceptance: `app/frontend/e2e/admin-smoke.py`.

Fixture được sinh một lần trong quá trình phát triển, được review bằng diff và đóng gói cùng ứng dụng. Trình duyệt không đọc workbook lúc runtime.

### 13.5. Bản làm việc Excel-first đã triển khai

Mục tiêu của lát cắt hiện tại là chứng minh đội phát triển đã hiểu và biểu diễn đủ workbook trước khi tối ưu luồng theo vai trò. Route có hai tab tương ứng hai sheet nguồn:

| Tab web | Header giữ nguyên | Dòng chấm nguyên tử | Trường nhập trực tiếp |
| --- | ---: | ---: | --- |
| `Đại học, Cao đẳng` | 12 | 30 | Tổ theo dõi, Phụ trách, Tự chấm, Được chấm, Link minh chứng, Lý do trừ điểm |
| `Điểm thưởng` | 10 | 25 | Tổ theo dõi, Phụ trách, Tự chấm, Được chấm, Link minh chứng, Báo cáo tóm tắt kết quả |

Các giá trị `Tỉ lệ %`, `Xếp loại`, tổng điểm cơ bản, điểm thưởng thô, điểm thưởng áp dụng và tổng điểm được tính lại ngay khi dữ liệu thay đổi. Bản local đồng thời kiểm tra ba quy tắc có thể xác định từ workbook/PDF: điểm không vượt khung, link minh chứng phải là URL hợp lệ, và phải nhập lý do khi `Được chấm < Tự chấm`.

Việc đặt trường của nhiều chủ thể trên cùng một bảng hiện là **harness đối chiếu nghiệp vụ**, chưa phải quyết định UX cuối cùng. Sau khi khách hàng xác nhận đủ header, dòng chấm và công thức, các trường sẽ được tách thành màn hình/module theo vai trò mà không thay đổi mô hình nghiệp vụ đã kiểm chứng.
