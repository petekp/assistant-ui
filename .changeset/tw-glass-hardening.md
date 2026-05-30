---
"tw-glass": patch
---

fix: compose backdrop-filter from tw-glass's own custom properties instead of Tailwind's private `--tw-backdrop-*` internals; add a cross-browser `glass-frosted` base (plain frosted blur, no SVG refraction — renders in Safari/Firefox where `glass` does not); add `@supports`/`forced-colors`/`prefers-reduced-transparency` fallbacks and a visible `glass-text` fallback; make `--glass-bg-opacity` non-inheriting; add a themeable `--tw-glass-tint`; let continuous utilities accept arbitrary values; ship a `LICENSE`, a `./filter-builder` export, and a wired `generate`/`generate:check`/`test` workflow.
