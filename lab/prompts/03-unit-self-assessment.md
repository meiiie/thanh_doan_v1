# Imagegen prompt — Unit self-assessment workspace

Use case taxonomy: `ui-mockup`  
Asset type: high-fidelity desktop web application screen, 16:10 landscape.

Create a high-fidelity desktop UI mockup for a Vietnamese youth union unit completing its campaign self-assessment. The experience should make missing work obvious and let the user finish one criterion at a time.

REFERENCE ROLES:
- Reference 1 (HoLiLiHu student dashboard): inherit the clear learner task orientation, progress visibility, calm blue/white hierarchy and Vietnamese readability.
- Reference 2 (HoLiLiHu teacher): inherit the structured role sidebar and restrained actionable list design.
- Reference 3 (legacy campaign screenshot): understand the domain’s detailed numbered criteria and proof submission. Do not copy the crowded table, gray stat blocks, emoji navigation or giant chart.

CANVAS AND LAYOUT:
- 16:10 desktop product application, approximately 1536×960 feeling.
- 256px white sidebar with product name “Hồ sơ chiến dịch” and exact items: “Việc cần làm”, “Hồ sơ tự chấm” active, “Minh chứng”, “Giải trình”, “Kết quả”, “Lịch sử hồ sơ”. Bottom identity “Đoàn phường Lạch Tray”.
- Compact top bar: “TNTN Hè 2026”, stage “Tự chấm”, deadline “Còn 5 ngày”, help, notifications, account.
- Main header: breadcrumb “Hồ sơ tự chấm / Nhóm 4”, title “Tiêu chí 4.2”, autosave state “Đã lưu lúc 10:32”. No giant page banner.
- Below is a focused three-column assessment workspace.

LEFT CRITERIA NAVIGATOR (~264px):
- Heading “Bảng tiêu chí”, compact overall progress “28 / 36 hoàn tất”.
- Groups numbered 1 through 6. Group 4 expanded with criteria 4.1–4.5. Each item has a clear state icon and short label. “4.2” selected; “4.3” shows “Thiếu minh chứng”; avoid pill overload.

CENTER CRITERION EDITOR (flexible):
- Full criterion title “4.2 · Duy trì hoạt động tư vấn hỗ trợ thanh niên khởi nghiệp”.
- Description and scoring guide in a quiet bordered information section.
- Numeric field “Điểm tự chấm” displaying “8.0” and suffix “/ 10 điểm”.
- Textarea “Mô tả kết quả thực hiện” with concise realistic Vietnamese content.
- Evidence section “Minh chứng” with two compact rows, one link and one PDF, each showing title, source and status; understated dashed button “Thêm minh chứng”.
- Inline validation note near the evidence section, not a floating toast.

RIGHT SUMMARY PANE (~320px):
- Title “Tóm tắt hồ sơ”.
- Total “82.5 / 100 điểm”, simple thin progress bar.
- Checklist: “28 tiêu chí hoàn tất”, “3 tiêu chí thiếu minh chứng”, “1 lỗi cần sửa trước khi gửi”.
- A single highlighted blocker with link “Đi tới lỗi”.
- Quiet note “Chỉ có thể gửi khi không còn lỗi”. Do not show submit as primary until ready.

STICKY FOOTER:
- “Tiêu chí trước”, secondary “Lưu”, one primary “Lưu & tiếp theo”. Show keyboard-friendly, stable footer that does not cover content.

VISUAL SYSTEM:
- Background #F6F8FB, surface white, primary #0056D2, ink #0B1F33, border #DCE3EC, restrained semantic tints.
- Be Vietnam Pro or similar Vietnamese sans; 28px title, 15–16px body. 8px grid, 44px controls, 8px control radius, 12px panels, almost no shadow.
- Calm, trustworthy, crafted, accessible. Information hierarchy comes from spacing, typography and borders.

AVOID:
- gradients, glassmorphism, photos, illustrations, 3D, fake browser chrome, watermark;
- rendering all 36 criteria as one long table; dashboard cards or charts; emoji icons;
- giant title, excessive whitespace, excessive pills, blue background everywhere, multiple primary buttons;
- tiny text, lorem ipsum, or decorative data unrelated to completing the form.

Success criterion: the unit immediately understands what remains, edits one criterion without losing progress, and knows why submission is blocked.

