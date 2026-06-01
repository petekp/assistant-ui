# Circuit Handoff

Source: saved continuity record
Record: continuity-a73315ab-80e1-4cd2-9ba7-f4d06ceb25b1
Kind: standalone

## Goal
Implement the redesigned tw-glass as ONE auto-routing `glass` class (premium pure-CSS approximation baseline + Chromium-only true-refraction enhancement), per packages/tw-glass/REDESIGN.md.

## Next Action
New session: edit scripts/filter-builder.mjs + generate.mjs to emit the new surface, then run `pnpm --filter tw-glass generate`. Build (a) the frost-on-host approximation baseline (frost + tint + specular sheen + asymmetric inset rim + layered depth + baked grain) and (b) the gate-wrapped Chromium refraction. Collapse to one `glass` base + orthogonal modifiers. Add a patch changeset. Verify in Chromium + real Safari + Firefox via the /tmp/glass-proto harness.

## State
- DECISION LOCKED + PROVEN this session in Chromium + real Safari 18.6 + Firefox. Full proposal (CSS skeleton, API table, migration): packages/tw-glass/REDESIGN.md (untracked). Raw empirical log: /tmp/glass-proto/FINDINGS.md.
- Architecture: ONE `glass` base. Always-on premium approximation on properties every engine renders (frost-on-host blur/saturate/brightness + tint + specular sheen on ::before + asymmetric inset rim and layered depth in box-shadow + baked feTurbulence grain). Chromium-only true SVG refraction is an ADDITIVE, @supports-gated enhancement that re-declares backdrop-filter; Safari/FF never see the url(), so they are never blank.
- The gate (verified TRUE only in Chromium, FALSE Safari+FF): `@supports (not (-webkit-hyphens: none)) and (not (-moz-appearance: none))`. Fail-safe: gate failure loses Chromium refraction, never blanks Safari. Chosen over the Houdini paint() gate which fails dangerously.
- API: one `glass` base + orthogonal modifiers each owning ONE custom property (tint, blur, saturation, brightness, bg, sheen, elevation, refract [Chromium-only, replaces strength], aberration [sub-property of refract, replaces chromatic], optional rim-hero). Refraction url() leaves the shared --tw-glass-filter slot; aberration becomes a property OF the single refraction filter. Resolves REVIEW.md HIGH shared-slot flaw.
- Empirically settled: the current shipping `.glass` is BLANK in Safari/FF (the regression being fixed); blur(var(--x)) works in Safari; REJECT z-index:-1 ::before frost (samples page in Safari, NOT Chromium) so frost stays on host; mask-composite rim follows rounded corners (optional hero); premium-max recipe shows Safari can look genuinely glass-like.
- Build mechanics: src/index.css is GENERATED — never hand-edit; edit generate.mjs/filter-builder.mjs then `pnpm --filter tw-glass generate` (node + oxfmt); `generate:check` is the CI guard; tests via `node --test test/*.test.mjs`.
- Harness: /tmp/glass-proto/capture.sh (Chromium via agent-browser, Safari via osascript dedicated-window + region screencapture, Firefox via open -a Firefox + full-screen). python3 http.server :8765 may still be running. See memory cross-browser-screenshot-harness.
- Memories saved: tw-glass-redesign, chromium-css-supports-gate, cross-browser-screenshot-harness.

## Debt
- BACK-COMPAT decision REQUIRED before breaking the API: tw-glass is published publicly (npm 0.0.5, has downloads). Decide keep deprecated aliases for one release (glass-frosted -> glass, glass-strength-* -> glass-refract-*, glass-chromatic-* -> glass-aberration-*) vs hard break. User default biases to breaking changes but confirm since it is published.
- CHANGESET REQUIRED (AGENTS.md): published-package change needs a patch changeset.
- Keep `.mjs` no-build generator; add // @ts-check + JSDoc + CI `tsc --checkJs --noEmit` to kill the hand-written .d.mts drift (REVIEW.md LOW). REDESIGN.md next-step item 6.
- Open empirical gaps to close during implementation: perf pass under scripted scroll incl. iOS Safari (Q6) + per-page surface budget + blur-radius ceiling ~12px; grain pixel-consistency across engines (Q5); adaptive contrast via light-dark tint for legibility; refraction corner-radius mismatch (map rx=4 vs ~16px cards, REVIEW MEDIUM) — parameterize per-radius.
- Gate longevity: document tested versions (Chromium, Safari 18.6, Firefox); re-validate on major releases. Track WebKit #245510 — if SVG-in-backdrop-filter is fixed, gate removable.
- Branch tw-glass-updates is generically named and unpushed (commits c8d04d084, 96dd3d274); rename before any PR. REDESIGN.md / REVIEW.md / REVIEW-findings.json / .circuit/ / /tmp/glass-proto are untracked or ephemeral.
