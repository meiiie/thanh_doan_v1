# Design specification v2 — Calm Precision

Status: normative for the local design lab. Images are illustrative; this document and the coded specimen are the source of truth.

## 1. Desired human response

The interface should make a person feel **calm, oriented and in control**. “Apple-like” here means intention, agency, familiarity, flexibility, simplicity and craft—not copying rounded glass surfaces or Apple products.

Every visible element must answer at least one question:

1. Where am I?
2. What changed?
3. What needs my decision?
4. What happens if I act?
5. How do I recover?

If an element answers none, remove it. If hiding context increases uncertainty, keep the context: simplicity is lower cognitive friction, not fewer pixels.

## 2. Measurable visual system

### 2.1 Base unit and spacing

Let `u = 4 CSS px`. Every spatial token is an integer multiple of `u`:

| Token | Formula | Value | Use |
|---|---:|---:|---|
| `space-1` | `1u` | 4px | icon/text optical correction only |
| `space-2` | `2u` | 8px | label–control, icon–label |
| `space-3` | `3u` | 12px | compact internal padding |
| `space-4` | `4u` | 16px | normal component padding |
| `space-6` | `6u` | 24px | related group separation |
| `space-8` | `8u` | 32px | section separation |
| `space-12` | `12u` | 48px | page region separation |
| `space-16` | `16u` | 64px | shell dimension / major rhythm |

Rule of proximity: distance inside a group is at most half the distance between groups. A field label at 8px and the next field at 24px creates an unambiguous `1:3` grouping ratio.

### 2.2 Desktop layout equation

For viewport width `V`:

```text
S = 256                                  when V ≥ 1280
S = 72                                   when 960 ≤ V < 1280
S = 0 (drawer)                           when V < 960
P = clamp(20, 0.025 × (V − S), 40)
C = min(V − S − 2P, 1440)
```

`S` is the role sidebar, `P` the horizontal page inset and `C` the main content width. Ordinary pages center `C`; data workbenches may use the full `V − S` width.

Twelve-column page grid:

```text
gutter G = 24px
column K = (C − 11G) / 12
```

At `C = 1200`, `K = 78px`. Controls align to columns or to the 4px baseline, never to accidental text edges.

### 2.3 Workbench equation

For reviewer/submission workspaces:

```text
Q = clamp(264px, 20vw, 304px)            context rail
I = clamp(336px, 24vw, 384px)            inspector/decision pane
M = available width − Q − I − 2×16px     main evidence/editor pane
```

- Keep three panes only while `M ≥ 520px`.
- If `M < 520px`, context rail becomes a left drawer.
- If the remaining main+inspector width is below 760px, inspector becomes a right sheet.
- Below 720px, use one sequential task column; never miniaturize three panes.

### 2.4 Typography scale

Base body size `b = 16px`; scale ratio `r = 1.2` (minor third):

```text
t(n) = b × rⁿ
```

Rounded to usable optical sizes while keeping every line-height on the 4px baseline:

| Style | Size / line | Weight | Tracking | Use |
|---|---|---:|---:|---|
| `meta` | 12 / 16 | 500 | +0.012em | timestamps, secondary data |
| `label` | 13 / 20 | 600 | +0.006em | labels, table headers |
| `body` | 16 / 24 | 400 | 0 | default reading |
| `body-strong` | 16 / 24 | 600 | -0.004em | task/title in rows |
| `title-3` | 19 / 28 | 600 | -0.008em | panel headings |
| `title-2` | 23 / 32 | 600 | -0.012em | section headings |
| `title-1` | 28 / 36 | 700 | -0.018em | one page title |
| `display` | 34 / 40 | 700 | -0.024em | rare result/receipt emphasis |

Use one neutral UI family: `system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Do not add a display font merely to create brand personality; hierarchy comes from size, spacing and weight. Numeric columns use `font-variant-numeric: tabular-nums`.

Reading constraints:

- Long-form help: `48–72ch`.
- Dense table labels: one line when the full value is available through expansion/title.
- Never use a font below 12px.
- At text zoom ≥ 200%, reduce columns before truncating content.

## 3. Color as language

### 3.1 Area budget

On a typical light screen:

```text
neutral surfaces and ink: 88–94%
brand blue:                4–8%
all semantic colors:       0–3%
```

This is a review budget, not a decorative recipe. Blue means “interactive, selected or current progress”; it must not color inactive headings or decoration. Red means “blocking/destructive,” never “attention” in general.

### 3.2 Canonical tokens and verified contrast

| Role | Foreground | Background | WCAG contrast | Allowed use |
|---|---|---|---:|---|
| Primary action | `#FFFFFF` | `#0756C9` | 6.60:1 | one primary button per action region |
| Brand link/selection | `#0756C9` | `#FFFFFF` | 6.60:1 | links, current item, progress |
| Brand on tint | `#0756C9` | `#EDF5FF` | 6.00:1 | selected row/background |
| Primary ink | `#111827` | `#FFFFFF` | 17.74:1 | titles, body |
| Secondary ink | `#374151` | `#FFFFFF` | 10.31:1 | helper text |
| Muted ink | `#6B7280` | `#FFFFFF` | 4.83:1 | metadata and supporting copy |
| Success | `#047857` | `#ECFDF5` | 5.21:1 | completed/valid |
| Warning | `#92400E` | `#FFFBEB` | 6.84:1 | risk/approaching deadline |
| Danger | `#B91C1C` | `#FEF2F2` | 5.91:1 | blocker/destructive/error |
| Information | `#1D4ED8` | `#EFF6FF` | 6.16:1 | neutral system information |

Supporting surfaces:

```css
--page: #f8fafc;
--surface: #ffffff;
--surface-subtle: #f9fafb;
--border: #e5e7eb;
--border-strong: #d1d5db;
--scrim: rgb(17 24 39 / 40%);
```

Color never carries status alone: pair it with a distinct icon shape and Vietnamese text.

### 3.3 Material hierarchy

Use three physical levels only:

1. `content`: page background, no shadow.
2. `surface`: white panel, border or spacing—never both border and large shadow without reason.
3. `overlay`: sheet/dialog/popover with `0 16px 48px rgb(11 31 51 / 14%)`.

Translucency is reserved for sticky topbars and sheets that float above scrolling content:

```css
background: rgb(255 255 255 / 88%);
backdrop-filter: blur(18px) saturate(1.2);
```

Never stack translucent layers. Under `prefers-reduced-transparency`, use solid white.

## 4. Component contracts

### 4.1 Button

```text
height: 44px default, 40px dense
horizontal padding: 16px; icon-only target: 44×44px
radius: 8px
icon: 18px, stroke 1.75px
label: 14/20, weight 600
gap: 8px
```

- Primary: white on brand; at most one per action region.
- Secondary: primary ink on white with strong border.
- Tertiary: brand text, transparent background.
- Danger: danger foreground/background only for destructive commit.
- Press feedback begins on pointer-down: `translateY(1px) scale(.985)`.
- Loading preserves width and label context; disabled requires a visible contextual reason.

### 4.2 Navigation item

```text
height: 44px
inset: 12px
icon: 20px
icon–label gap: 12px
radius: 8px
active indicator: 3×24px at leading edge
```

Active state uses brand tint + blue text + indicator. Hover uses neutral subtle background, not a second blue. Badge appears only for an actionable count; “18” means 18 tasks, never decorative totals.

### 4.3 Field

```text
label: 13/20 semibold
label–control gap: 8px
control height: 44px; textarea min-height: 112px
horizontal inset: 12px
radius: 8px
border: 1px; focus ring: 3px outer
help/error gap: 6px
```

Placeholder is an example, never the label. Validation is inline and included in a top error summary for long forms. Autosave exposes `Đang lưu`, `Đã lưu lúc …`, or `Không thể lưu — Thử lại` as text.

### 4.4 Status mark

```text
height: 24px
icon: 14px
padding-inline: 8px
radius: 6px (not pill)
label: 12/16 semibold
```

Use only for a true workflow state. Owner, date, score, category and arbitrary metadata remain plain text.

### 4.5 Task row

```text
min-height: 64px
vertical inset: 10px
leading status/icon column: 24px
content gap: 4px
trailing action target: 44×44px
```

One row communicates `task → owner/deadline → blocker → next action`. No nested card inside the row.

### 4.6 Data table

```text
header height: 40px
row height: 52px normal, 44px user-selected dense mode
cell inset: 12px horizontal
numeric alignment: end; text alignment: start
```

Row actions live in one trailing menu. Sticky headers use a scroll-edge fade instead of a heavy shadow. On narrow screens, convert rows to task summaries rather than horizontal scrolling through critical actions.

### 4.7 Evidence row

```text
min-height: 68px
file glyph container: 32×32px
title: 14/20 semibold
metadata: 12/16
row action: 44×44px
```

Required semantics: evidence type, name, source, submitter, time, accessibility state and view action. Broken/unreachable is persistent inline status, not a toast.

### 4.8 Score control

```text
control height: 52px
numeric value: 28/32 bold, tabular
minus/plus targets: 44×44px
step and ceiling: always visible
```

Server validates range and step. A variance from the previous round activates a required reason immediately, before submission.

### 4.9 Alert and receipt

- Inline alert: icon 20px, title 14/20 semibold, body 14/20, inset 16px, radius 10px.
- Blocking alert stays near the affected task and appears in the page summary.
- Toast is only for nonblocking ephemeral feedback; never use it for validation or final receipt.
- A committed workflow action produces a receipt containing actor, timestamp, version, effect and trace link.

### 4.10 Dialog and sheet

- Dialog only for focused destructive/irreversible decisions; width `min(480px, viewport − 32px)`.
- Inspector/sheet is for parallel detail, evidence preview and editable context.
- Open and close from the same spatial origin. Focus is trapped only in modal tasks; nonmodal sheets keep the surrounding workflow reachable.

## 5. Interaction physics

### 5.1 Response budget

| Event | Visual response |
|---|---:|
| pointer/key down | next frame, target ≤16ms |
| hover/focus color | 120ms |
| ordinary state change | 180ms |
| non-gesture sheet/popover | critically damped, response 0.32s |
| dragged sheet release | damping ≈0.82, response 0.30s, inherit velocity |
| long layout transition | maximum 240ms unless gesture-driven |

No artificial delay. Animation never disables input. Gesture-driven motion starts from the live presentation value and can be interrupted/reversed.

### 5.2 Spatial rules

- Enter and exit on the same path.
- Popovers originate at their trigger.
- A right inspector dismisses to the right.
- Drag uses 1:1 pointer tracking after a 10px intent threshold.
- Boundary overscroll uses progressive resistance, not a hard stop.
- Only `transform` and `opacity` animate per frame.

### 5.3 Reduced motion

`prefers-reduced-motion` replaces movement/spring with a 120–180ms cross-fade. `prefers-reduced-transparency` removes blur. `prefers-contrast: more` strengthens boundaries and uses higher-contrast state colors. Feedback remains present in all modes.

## 6. Composition rules

- One `h1`, one visually dominant task and one primary action per task region.
- The first meaningful content begins within 48px of the page title.
- Use left/start alignment for scanning; center only receipts, empty states or short confirmations.
- Do not place equal-weight KPI cards in a row. Rank exceptions and actions.
- Do not show the global phase stepper outside campaign overview/configuration.
- Do not use charts unless they answer a question that a sorted list cannot answer faster.
- Do not use icons without labels in primary navigation when expanded.
- Do not use pills for ordinary metadata, large corner radii, gradient backgrounds, glass-on-glass or decorative motion.

## 7. Verification gates

1. All token values resolve to the 4px grid unless marked optical correction.
2. Normal text contrast ≥4.5:1; large/bold text ≥3:1; focus indicator ≥3:1 against adjacent colors.
3. Every pointer target ≥44×44px by default; dense desktop exception never below 40px and still provides 44px hit area.
4. At 200% text zoom, no task action disappears or overlaps.
5. Tab order matches reading order; sticky chrome never obscures focus.
6. Color-blind simulation preserves state through icon + text.
7. Press feedback appears by the next rendered frame.
8. A screenshot color audit stays inside the neutral/brand/semantic budget.

## 8. Primary references

- Apple design principles and WWDC26: https://developer.apple.com/videos/play/wwdc2026/250/
- Apple HIG layout: https://developer.apple.com/design/human-interface-guidelines/layout
- Apple HIG typography: https://developer.apple.com/design/human-interface-guidelines/typography
- Apple HIG color: https://developer.apple.com/design/human-interface-guidelines/color
- Apple HIG accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
