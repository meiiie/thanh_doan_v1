# Imagegen provenance

## Concept 01 — workflow accent

- Công cụ: OpenAI built-in `imagegen`.
- Use case: `logo-brand`.
- Ảnh tham chiếu: `neko-family-overview.png`, chỉ dùng làm tham chiếu identity/phong cách.
- Kết quả: `concepts/neko-doan-workflow-accent-v1.png`.
- Vai trò: concept gate; không phát hành vào ứng dụng.

Prompt cuối:

```text
Use case: logo-brand
Asset type: Neko Đoàn product-logo exploration, concept gate only
Primary request: Create one centered, minimal product mark for “Neko Đoàn”, a trustworthy internal campaign evidence and review workflow. Preserve the Neko Family identity from Image 1: the same warm Milk cat, two widely spaced Cocoa capsule eyes, and the protective curled Cocoa tail. Introduce exactly one restrained Sky-blue workflow cue outside the face: a thin rounded baseline or small status point that suggests continuity and accountable handoff, never an accessory or costume.
Input images: Image 1 is the approved Neko Family style and identity reference, not an edit target.
Style/medium: flat, vector-friendly logo mark; strong silhouette; mathematically balanced negative space; calm institutional confidence; friendly but not childish.
Composition/framing: single mark only, centered, generous clear space, square canvas, transparent background.
Color palette: Milk #F5F0E6, Cocoa #2A2928, Cocoa Lift #454241, optional Sky #BBDDF2 only.
Constraints: Neko Peek remains the recognizable primary mark; tail stays visible; no mouth, nose, whiskers, paws, fur, blush, pupils, eyebrows, clothing, badges, stars, flags, checkmarks, document icons, official youth-union symbols, letters, words, gradients, shadows, 3D, mockup, or watermark. No extra characters or objects.
```

Quyết định: giữ Neko Peek chuẩn làm logo. Chỉ lấy ý niệm “đường liên tục + điểm trạng thái Sky” cho lockup/social card; không đưa biến dạng trong ảnh concept sang vector phát hành.
