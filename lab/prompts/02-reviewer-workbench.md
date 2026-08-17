# Imagegen prompt — Reviewer workbench

Use case taxonomy: `ui-mockup`  
Asset type: high-fidelity desktop web application screen, 16:10 landscape.

Create a high-fidelity desktop UI mockup for the specialist reviewer workspace of a Vietnamese campaign scoring system. This is an evidence-based decision workbench. It must feel focused and faster than a long form page.

REFERENCE ROLES:
- Reference 1 (HoLiLiHu teacher): inherit its role-specific navigation, calm white/navy hierarchy, list legibility and clear primary action.
- Reference 2 (HoLiLiHu admin): inherit its 256px structured sidebar, thin borders, 8px rhythm and practical institutional tone.
- Reference 3 (legacy campaign screenshot): understand that reviewers handle many detailed criteria and evidence. Do not copy its old sidebar, emoji, giant gray panels, pie chart or dense endless table.

CANVAS AND LAYOUT:
- 16:10 desktop product screen, approximately 1536×960 feeling.
- App sidebar 256px with exact compact items: “Việc cần làm” active, “Đang thẩm định”, “Giải trình”, “Đã hoàn thành”, “Đơn vị theo dõi”, “Lịch sử của tôi”. Bottom shows reviewer identity “Nguyễn Minh Anh · Tổ 2”.
- Compact top bar: campaign “TNTN Hè 2026”, phase “Vòng 1”, deadline, help and account.
- Main work area uses a purposeful three-pane layout after a slim page header.

LEFT WORK QUEUE PANE (~280px):
- Heading “Hàng chờ của tôi” with count 18, search, two compact filter controls.
- Five realistic unit items showing name, due/overdue state and progress. Selected item: “Đoàn phường Lạch Tray”, pale blue selection. No card tiles.

CENTER EVIDENCE PANE (flexible):
- Breadcrumb “Hàng chờ / Lạch Tray / Tiêu chí 4.2”.
- Heading “4.2 · Hoạt động hỗ trợ thanh niên khởi nghiệp”, maximum score “10 điểm”, concise criterion description.
- Segmented tabs or understated text tabs: “Minh chứng 3”, “Giải trình”, “Lịch sử”.
- Three evidence rows with file/link icon, clear Vietnamese title, source, submitted time and a restrained “Xem” action. One evidence item is flagged “Liên kết không truy cập được” in a non-alarming warning treatment.
- A readable explanation block from the unit, not a chat bubble.

RIGHT DECISION PANE (~360px):
- Sticky white decision panel titled “Quyết định vòng 1”.
- Comparison strip: “Tự chấm 9.0” and “Trần 10.0”.
- Large but restrained numeric score input showing “8.0 / 10”.
- Label “Nhận xét chuyên viên” with a concise Vietnamese comment, helper explaining that a reason is required because the score differs.
- Checklist summary for evidence reviewed, ownership, and variance.
- At bottom, secondary “Lưu nháp” and one primary “Hoàn thành tiêu chí”; below it small “Tiêu chí tiếp theo 4.3”.

VISUAL SYSTEM:
- Background #F6F8FB, surface white, primary #0056D2, ink #0B1F33, border #DCE3EC; semantic colors used sparingly.
- Be Vietnam Pro or similar Vietnamese sans. 8px system, 44px controls, 8px control radius, 12px panels. Very subtle or no shadow.
- Dense enough for professional review work but breathable; use dividers and whitespace rather than nested cards.

AVOID:
- gradients, glass, 3D, photos, illustrations, fake browser frame, watermark;
- dashboards, large KPI cards, charts, full-page form, emoji, decorative icons, card mosaic;
- hiding evidence behind many clicks; placing decision controls far from context;
- tiny text, lorem ipsum, excessive pills or multiple blue primary buttons.

Success criterion: reviewer sees queue, evidence and decision together without losing context.

## Correction prompt applied after visual review

The first generation got the three-pane workbench right but copied an official emblem and introduced a heavy navy sidebar. It was rejected and edited with this prompt:

> Edit this existing reviewer workbench mockup with only the following visual corrections. Preserve the exact three-pane layout, all content organization, proportions, typography scale, queue, evidence rows, score controls, decision panel and overall high-fidelity quality. Replace the copied official emblem with a small original abstract blue geometric mark that resembles no real organization or national symbol. Change the entire dark navy sidebar to white, with dark ink text, subtle border, dark outline icons, and a pale-blue active row with a slim blue indicator. Keep blue only for actions, links, selected states and small progress indicators. Preserve the main content and decision pane. No gradients, copied branding, watermark or browser chrome.

