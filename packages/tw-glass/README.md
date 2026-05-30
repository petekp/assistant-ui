# `tw-glass`

[![npm version](https://img.shields.io/npm/v/tw-glass)](https://www.npmjs.com/package/tw-glass)
[![npm downloads](https://img.shields.io/npm/dm/tw-glass)](https://www.npmjs.com/package/tw-glass)
[![GitHub stars](https://img.shields.io/github/stars/assistant-ui/assistant-ui)](https://github.com/assistant-ui/assistant-ui)

Tailwind CSS v4 plugin for glass refraction effects. Pure CSS, no JavaScript. Uses inline SVG displacement maps with `filterUnits="objectBoundingBox"` so refraction scales with element size automatically.

## Installation

```bash
npm install tw-glass
```

```css
@import "tw-glass";
```

Requires Tailwind CSS v4+.

## Usage

```html
<div class="glass rounded-xl p-6">Refracted backdrop</div>
<div class="glass glass-surface glass-strength-30 rounded-xl p-6">Frosted panel</div>
<h1 class="glass-text" style="background-image: url(photo.jpg)">
  Glass heading
</h1>
```

Pair `glass` with `glass-surface` for a frosted-panel look, or layer on strength, chromatic, and backdrop modifiers for stronger effects.

## Utilities

| Utility                                     | Effect                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `glass`                                     | Base **refraction** (equivalent to `glass-strength-20`). Chromium only — see [Browser support](#browser-support). |
| `glass-frosted`                             | Base **frosted blur**, no refraction. Renders in every browser. Use _instead of_ `glass`. |
| `glass-surface`                             | Adds a frosted-panel background tint.                                   |
| `glass-strength-{5,10,20,30,40,50}`         | Displacement intensity.                                                 |
| `glass-chromatic-{5,10,20,30,40,50}`        | RGB channel split for a prism effect. **Includes displacement — use instead of `glass-strength-*`.** |
| `glass-blur-{n}`                            | Backdrop blur in px (default 2). Also accepts arbitrary lengths, e.g. `glass-blur-[3px]`. |
| `glass-saturation-{n}`                      | Backdrop saturation in % (default 120).                                 |
| `glass-brightness-{n}`                      | Backdrop brightness in % (default 105).                                 |
| `glass-bg-{n}`                              | Frosted-surface overlay opacity in % (default 8).                       |
| `glass-text`                                | Clip a background image to the text shape.                              |

### Pick a base: `glass` vs `glass-frosted`

An element gets a single `backdrop-filter`, so the two bases are **mutually exclusive** — choose one:

- **`glass`** — the SVG refraction. Renders in Chromium (Chrome/Edge); shows nothing in Safari/Firefox.
- **`glass-frosted`** — a plain frosted blur with no refraction. Renders in every browser.

Both honor the same `glass-blur-*` / `glass-brightness-*` / `glass-saturation-*` modifiers and compose with `glass-surface`. If you need the same look everywhere, reach for `glass-frosted`.

### Strength vs. chromatic

`glass-strength-*` and `glass-chromatic-*` both define the displacement filter, so they are **mutually exclusive** — applying both keeps only one. Chromatic already includes displacement, so reach for it as a richer alternative to strength, not an addition. Pick one per element. (Both are refraction modifiers, so they only apply to `glass`, not `glass-frosted`.)

### Theming the surface

`glass-surface` is tinted white by default. Override `--tw-glass-tint` (space-separated RGB channels) for a smoked/dark or brand-colored panel:

```html
<div class="glass glass-surface" style="--tw-glass-tint: 0 0 0">Dark glass</div>
```

## Browser support

The refraction effect references an SVG filter from `backdrop-filter`. Only Chromium renders that:

- **Chromium (Chrome, Edge):** full refraction. ✅
- **Safari:** does **not** apply an SVG filter reference in `backdrop-filter` — neither a `data:` URI nor an inline `url(#id)` (verified empirically). Plain `backdrop-filter: blur()` works on its own, but because tw-glass composes the SVG filter into the _same_ `backdrop-filter` value as the blur/brightness/saturation, Safari treats the whole value as valid-but-non-rendering and applies nothing. ❌ (refraction **and** blur)
- **Firefox:** also does not apply SVG filter references in `backdrop-filter`, so the displacement does not render. ❌ (refraction)

> **No plain-blur fallback on bare `.glass`.** Where the SVG filter can't render, the _entire_ `backdrop-filter` is dropped: a single CSS value can't be partially valid, and no `@supports` query distinguishes "parses" from "renders" here (Safari parses the `url()` as valid). So a bare `.glass` shows no backdrop effect outside Chromium. If you want a frosted-glass effect that works everywhere, use **`glass-frosted`** instead of `glass` — it's plain blur/brightness/saturation, no SVG filter, so it renders in every engine. (`glass-surface` adds the tint/border/shadow panel and composes with either base.)

`glass-surface` also includes fallbacks for `prefers-reduced-transparency` and `forced-colors` (Windows High Contrast) so panels stay legible where the effect can't render or transparency is unwanted.

## Gotchas

- **`glass` creates a new stacking context and containing block.** Like any non-`none` `backdrop-filter` (and like `filter`/`transform`), `.glass` becomes the containing block for `position: fixed`/`absolute` descendants and forms its own stacking context. A fixed modal or tooltip rendered _inside_ a `.glass` element will anchor to the glass box, not the viewport — hoist overlays out of the glass subtree.
- **Don't combine `glass` with Tailwind's native `backdrop-*` utilities** (e.g. `backdrop-blur-md`). An element has a single `backdrop-filter`; mixing them produces order-dependent results. Use the bundled `glass-blur-*` / `glass-saturation-*` / `glass-brightness-*` modifiers instead.
- **Performance:** each `.glass` element is a separate compositing layer running an SVG displacement pass. A handful is fine; dozens on a scroll-heavy list (dashboards, long feeds) can drop frames and use significant GPU memory on low-end devices. Budget accordingly.
- **`glass-text` needs a background image.** It clips the element's `background-image` to the text. Text is only made transparent where `background-clip: text` is supported (gated behind `@supports`), so unsupported browsers keep visible text — but if you forget the image (or it 404s), there's nothing to clip. `background-attachment: fixed` gives a parallax-window effect on desktop but is rendered as `scroll` on iOS Safari.

## Contributing

`src/index.css` is **generated** — don't edit it by hand. The source of truth is `scripts/generate.mjs` + `scripts/filter-builder.mjs`.

```bash
pnpm --filter tw-glass generate       # regenerate + format src/index.css
pnpm --filter tw-glass generate:check # CI guard: fails if src/index.css is stale
pnpm --filter tw-glass test           # unit tests for the filter builders
```

## Documentation

Live demo and full reference at [assistant-ui.com/tw-glass](https://www.assistant-ui.com/tw-glass).
