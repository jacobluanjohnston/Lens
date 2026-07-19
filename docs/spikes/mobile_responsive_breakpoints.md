# Spike: Mobile responsive breakpoints for the controls/panel layout

**Question:** How do we position the lens picker and neighbourhood panels on narrow viewports so they don't overlap the controls bar, show a visible strip of map, and work correctly across all common phone sizes — without breaking the narrow desktop browser view at the same pixel widths?

**We learned that a CSS pixel-width breakpoint alone cannot distinguish a phone from a narrow desktop browser window at the same width, and that `backdrop-filter` silently creates a stacking context that traps child `z-index` values — therefore we use `(hover: hover) and (pointer: fine)` to detect real mouse devices, and promote the lens panel to `z-index: 100` in the column's outer stacking context rather than relying on z-index inside the blurred element.**

---

## What we found

### 1. Pixel width can't tell a phone from a narrow desktop

A desktop browser dragged to 500px wide and an iPhone 14 Pro Max (430px) look identical to a `min-width` media query. We initially used a `min-width: 495px` threshold to apply a tighter `column top`, but that threshold was wrong for phones in the 430–494px range.

The correct signal is the pointer type. A real mouse reports `pointer: fine` and `hover: hover`. A phone touch screen reports `pointer: coarse` and `hover: none`. Chrome DevTools phone emulation correctly reports `pointer: coarse`, so the rule fires only for actual desktop browsers — not emulated ones.

```css
/* Only fires on a real mouse — not phone emulation, not touch screens */
@media (max-width: 640px) and (hover: hover) and (pointer: fine) {
  .right-panel-column { top: 104px; }
}
```

### 2. The controls bar wraps to different row counts by device and mode

The controls bar uses `flex-wrap: wrap`. How many rows it wraps to determines where the column must start (`column top`) to avoid overlapping it. We measured each case:

**Normal mode (non-compare):**

| Width | Items | Rows | Bar bottom | `column top` used |
|---|---|---|---|---|
| <430px (SE, XR, 12 Pro) | Logo + FROM + TO + CRIME | 2 | ~148px | 172px |
| 430–494px (14 Pro Max) | Logo + FROM + TO + CRIME | 2 | ~148px | 160px |
| ≥495px desktop (mouse) | Logo + FROM + TO + CRIME | 1 | ~91px | 104px |

*CRIME wraps to row 2 on phones because their inner width is ~307–362px and all four items total 427px.*

**Compare mode (4 date pickers + preset + exit button):**

| Width | Rows | Bar bottom | `column top` used |
|---|---|---|---|
| <430px (SE, XR, 12 Pro) | 4 | ~248px | 280px |
| ≥430px (14 Pro Max+) | 3 | ~192px | 220px |

Row height estimate: label (16px) + 3px gap + input (30px) = ~49px per row. Bar padding: 12px top + 12px bottom. Gap between rows: 8px.

### 3. The panel gap formula

Neighbourhood panels are pushed down with `margin-top` so a visible map strip sits between the lens picker and the panels. The formula:

```
margin-top = TARGET_VH − (column_top + lens_height + column_gap)
             where lens_height ≈ 60px, column_gap = 16px
```

This means panels always start at `TARGET_VH` regardless of `column_top`. **If `column_top` changes, the formula must be updated or the gap breaks silently — no error, it just looks wrong.**

Current values:

| Context | `column_top` | Target | `margin-top` |
|---|---|---|---|
| <430px normal | 172px | 55vh | `calc(55vh - 248px)` |
| 430–494px normal | 160px | 55vh | `calc(55vh - 236px)` |
| ≥495px desktop | 104px | 55vh | `calc(55vh - 180px)` |
| <430px compare | 280px | 65vh | `calc(65vh - 356px)` |
| ≥430px compare | 220px | 55vh | `calc(55vh - 296px)` |

Compare mode uses 65vh on small phones (vs 55vh) because the 4-row controls bar pushes the column to 280px, leaving almost no map visible at 55vh on a 667px screen (11px strip vs 94px at 65vh).

### 4. `backdrop-filter` creates a stacking context

The frosted-glass blur (`backdrop-filter: blur(28px)`) on `.lens-panel` creates a new stacking context. This scopes all `z-index` values on children to be local to that element — they no longer compete with elements outside it.

**Symptom:** the expanded lens picker dropdown (z-index: 10) appeared behind the neighbourhood panels even though 10 should be high enough.

**Why:** that `z-index: 10` only meant "above other things inside the lens panel's stacking context." The neighbourhood panels were outside it, so they painted on top regardless.

**Fix:** give `.lens-panel` itself `z-index: 100` in the column's outer stacking context. This promotes the whole lens panel above the neighbourhood panels first, then the dropdown's `z-index: 10` correctly floats above everything inside the panel's own context.

```css
.right-panel-column .lens-panel {
  position: relative;
  z-index: 100; /* load-bearing: see backdrop-filter stacking context note above */
}
```

---

## How we tested

Manual sweep in Chrome DevTools device emulation after every CSS change. No automated test can catch "this looks wrong." The device list that covers all meaningful breakpoint boundaries:

| Device | CSS width | Why |
|---|---|---|
| iPhone SE | 375px | Smallest common phone; worst-case vertical space |
| iPhone 12 Pro | 390px | Between SE and XR |
| iPhone XR | 414px | Between 12 Pro and the 430px threshold |
| iPhone 14 Pro Max | 430px | Sits exactly at the breakpoint — catches off-by-one errors |
| Samsung Galaxy S8+ | 360px | Narrowest common Android |
| Samsung Galaxy S20 Ultra | 412px | Tall Android; good for vh calculations |
| Galaxy Z Fold 5 | 344px / 882px | Tests both fold states |
| iPad Air | 820px | Should use desktop layout — confirms ≥641px rules fire |
| Desktop browser at minimum width | ~500px | Only real-mouse test; confirms `hover/pointer` rule fires |

**Always re-sweep the full list after any change.** A fix for iPhone SE can break iPhone 14 Pro Max — they hit different breakpoints.

---

## What's still not perfect

- **iPhone SE in compare mode** — 65vh gives ~94px of visible map, which is workable but tight. Going higher than 65vh shrinks the panel scroll area below ~215px and the rankings list gets cramped.
- **Galaxy Z Fold / A51/A71 in compare mode** — map strip is small but acceptable. Fixing it properly would require hiding one panel or a fold-aware layout.
- **Landscape mode** — not tested or accounted for.
