# Design system — Civic Instrument

## Direction

Technical/instrument for a public-service workflow: precise, calm, authoritative,
light-first, and data-led. The one signature element is the campaign phase rail.
No gradients, ornamental illustration, glass stacks, decorative charts, or
marketing motion inside the application.

## Foundations

- Fonts: native `system-ui` for Vietnamese UI; `ui-monospace` only for codes,
  dates, and compact metadata.
- Radius: `8px` everywhere except pills, which are fully rounded.
- Spacing: `4, 8, 12, 16, 24, 32, 48, 64`.
- Type: `12, 14, 16, 18, 20, 24, 30, 36`; body is `16px/1.5`.
- Motion: `120–200ms`, transform/opacity/color only; no content depends on it.
- Touch target: at least `44px`; focus is always visible.

## Color tokens

- Neutral: `#F7F8FA`, `#EEF1F4`, `#DCE2E8`, `#B6C0CB`, `#7A8795`,
  `#4D5966`, `#2D3742`, `#18212B`, `#0D141B`.
- Civic blue: `#EAF4FF`, `#CBE5FF`, `#8FC7FF`, `#4299E1`, `#1473B8`,
  `#0B5A91`, `#08466F`.
- Semantic only: success `#18794E`, warning `#9A6700`, danger `#B42318`.

Semantic variables live in `app/globals.css`; components never use arbitrary
hex values. Status always uses text plus shape/icon, never color alone.

## Component rules

- Exactly one primary action in a view.
- Hairline border is the default separation; shadows are reserved for dialogs.
- Labels are explicit; placeholders never replace labels.
- Dense desktop tables progressively become task lists on narrow screens.
- Loading, empty, error, disabled, focus, hover, active, and submitted states are
  product states, not afterthoughts.
