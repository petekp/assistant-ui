# `tw-glass`

[![npm version](https://img.shields.io/npm/v/tw-glass)](https://www.npmjs.com/package/tw-glass)
[![npm downloads](https://img.shields.io/npm/dm/tw-glass)](https://www.npmjs.com/package/tw-glass)
[![GitHub stars](https://img.shields.io/github/stars/assistant-ui/assistant-ui)](https://github.com/assistant-ui/assistant-ui)

Tailwind CSS v4 plugin for premium glass surfaces. Pure CSS, no JavaScript.

One auto-routing `glass` class. Every browser gets a rich glass **approximation**
(frost + tint + specular sheen + lit rim + layered depth + film grain). Chromium
additionally gets **true SVG refraction** — composed in automatically via an
`@supports` gate, so Safari and Firefox never see the SVG `url()` and keep the
approximation instead of rendering a blank box.

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
<div class="glass rounded-xl p-6">Glass panel</div>
<div class="glass glass-tint-black glass-elevation-lg rounded-xl p-6">Smoked, raised</div>
<div class="glass glass-refract-40 rounded-xl p-6">Stronger refraction (Chromium)</div>
<h1 class="glass-text" style="background-image: url(photo.jpg)">Glass heading</h1>
```

`glass` works on its own. Layer modifiers to taste — each owns exactly one custom
property, so they compose freely and never silently override each other.

## Utilities

| Utility                               | Effect                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `glass`                               | The base surface. Auto-routes: approximation everywhere, true refraction in Chromium. |
| `glass-tint-{white,black,slate,blue,emerald,amber,rose,violet}` | Surface tint. Or set `--tw-glass-tint` to any `R G B` triple. |
| `glass-bg-{n}`                        | Tint opacity in % (default 10).                                                     |
| `glass-blur-{n}`                      | Frost blur in px (default 12). Also accepts arbitrary lengths, e.g. `glass-blur-[14px]`. |
| `glass-saturation-{n}`                | Frost saturation in % (default 180).                                               |
| `glass-brightness-{n}`                | Frost brightness in % (default 106).                                              |
| `glass-sheen-{n}`                     | Specular highlight intensity in % (default 100).                                   |
| `glass-elevation-{sm,md,lg}`          | Layered depth-shadow tier (default `md`).                                          |
| `glass-refract-{5,10,20,30,40,50}`    | Refraction intensity. **Chromium only** (default `20`).                            |
| `glass-aberration-{5,10,20,30,40,50}` | Chromatic (RGB-split) refraction. **Chromium only.** Alternative to `glass-refract-*`. |
| `glass-rim-hero`                      | Swap the inset rim for a crisp `mask-composite` lit ring.                          |
| `glass-text`                          | Clip a background image to the text shape.                                         |

### Refraction vs. aberration

`glass-refract-*` and `glass-aberration-*` both define the single refraction
filter, so they are **mutually exclusive** — pick one. Aberration is the
chromatic flavor of refraction (it already includes displacement). Both are
**Chromium-only by design**: in Safari/Firefox they're inert and the surface
falls back to the frosted approximation. There's no "blank box" failure mode.

### Theming the tint

`glass-tint-*` covers common colors; for anything else set `--tw-glass-tint`
directly (space-separated RGB channels):

```html
<div class="glass" style="--tw-glass-tint: 12 74 110">Brand glass</div>
```

## How auto-routing works

`.glass` always applies a plain `backdrop-filter: blur() saturate() brightness()`
plus a tinted background, a specular-sheen + grain `::before`, and a lit-rim +
depth `box-shadow`. That stack renders in **every** engine.

True refraction (an SVG displacement `url()` in `backdrop-filter`) renders **only
in Chromium**. Safari/Firefox parse the `url()` as valid but render nothing, and
because a single `backdrop-filter` value can't be partially valid, they would
drop the *entire* filter — blur included — if it were composed in unconditionally.

So tw-glass re-declares `backdrop-filter` *with* the refraction `url()` inside a
gate that is true **only** in Chromium:

```css
@supports (not (-webkit-hyphens: none)) and (not (-moz-appearance: none)) { … }
```

`-webkit-hyphens` exists only in Safari, `-moz-appearance` only in Firefox, and
Chromium has neither — so the gate is robustly false in Safari/Firefox. Its only
realistic failure mode is benign (a future Chromium alias would lose the
refraction *bonus*, never blank the surface). Verified in Chromium, Safari 18.6,
and Firefox.

## Accessibility

The base surface includes fallbacks (no opt-in class needed):

- **`prefers-reduced-transparency: reduce`** → drops the blur and sheen for an
  opaque tinted panel.
- **`forced-colors: active`** (Windows High Contrast) → a system-colored,
  clearly-bordered panel.

## Gotchas

- **`glass` creates a new stacking context and containing block.** Like any
  non-`none` `backdrop-filter` (and like `filter`/`transform`), `.glass` becomes
  the containing block for `position: fixed`/`absolute` descendants and forms its
  own stacking context. A fixed modal or tooltip rendered _inside_ a `.glass`
  element anchors to the glass box, not the viewport — hoist overlays out of the
  glass subtree.
- **Don't combine `glass` with Tailwind's native `backdrop-*` utilities** (e.g.
  `backdrop-blur-md`). An element has a single `backdrop-filter`; mixing them
  produces order-dependent results. Use the bundled `glass-blur-*` /
  `glass-saturation-*` / `glass-brightness-*` modifiers instead.
- **Performance:** each `.glass` element is a separate compositing layer; in
  Chromium it also runs an SVG displacement pass. A handful is fine; dozens on a
  scroll-heavy list (dashboards, long feeds) can drop frames and use significant
  GPU memory on low-end devices. Budget accordingly and keep blur radii modest.
- **`glass-text` needs a background image.** It clips the element's
  `background-image` to the text. Text is only made transparent where
  `background-clip: text` is supported (gated behind `@supports`), so unsupported
  browsers keep visible text — but if you forget the image (or it 404s), there's
  nothing to clip. `background-attachment: fixed` gives a parallax-window effect
  on desktop but is rendered as `scroll` on iOS Safari.

## Contributing

`src/index.css` is **generated** — don't edit it by hand. The source of truth is
`scripts/generate.mjs` + `scripts/filter-builder.mjs`.

```bash
pnpm --filter tw-glass generate       # regenerate + format src/index.css
pnpm --filter tw-glass generate:check # CI guard: fails if src/index.css is stale
pnpm --filter tw-glass test           # unit tests for the filter builders
```

## Documentation

Live demo and full reference at [assistant-ui.com/tw-glass](https://www.assistant-ui.com/tw-glass).
