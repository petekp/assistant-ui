---
"tw-glass": patch
---

feat: redesign `glass` as one auto-routing class (premium approximation + Chromium refraction)

`glass` is now a single auto-routing surface. Every engine renders a premium
approximation (frost + tint + specular sheen + lit rim + layered depth + baked
grain); Chromium additionally composes in true SVG refraction via an `@supports`
gate, so Safari and Firefox keep the approximation instead of rendering a blank
box. This fixes the cross-browser regression where bare `.glass` was invisible
outside Chromium, and removes the need to choose a base per browser.

Breaking changes (no aliases kept — `tw-glass` is pre-1.0):

- `glass-frosted` and `glass-surface` are removed. Their behavior (cross-browser
  frost, tint, rim, depth, and the `prefers-reduced-transparency` / `forced-colors`
  fallbacks) is folded into the base `glass`. Replace both with `glass`.
- `glass-strength-{n}` → `glass-refract-{n}` (now documented Chromium-only).
- `glass-chromatic-{n}` → `glass-aberration-{n}` (composes as the chromatic flavor
  of the single refraction filter instead of clobbering a shared slot).
- The `--glass-bg-opacity` custom property is renamed to `--tw-glass-bg-opacity`.
- Frost defaults are richer: blur 12px, saturation 1.8, brightness 1.06, bg-opacity 0.1.

New modifiers: `glass-tint-*`, `glass-elevation-{sm,md,lg}`, `glass-sheen-*`,
`glass-rim-hero`. Each modifier owns exactly one custom property, so they compose
without silent overrides.
