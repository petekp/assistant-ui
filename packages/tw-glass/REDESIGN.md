<!--
  tw-glass redesign proposal — decision-ready research + empirical prototyping (2026-05-30).
  Method: 6-dimension parallel web/codebase research → adversarial verification → synthesis,
  then standalone-page prototypes rendered + screenshotted in Chromium (CDP), real Safari 18.6,
  and Firefox. Every load-bearing claim below was verified in all three engines this session.
  Prototype artifacts + raw findings: /tmp/glass-proto/ (FINDINGS.md, *.html, *-{chromium,safari,firefox}.png).
  This is a proposal, not shipped code. Constraints were set by the maintainer:
  WEB ONLY · ZERO JS · tiered-automatic fidelity · API simplicity is the north star.
-->

# tw-glass — Redesign Proposal: one auto-routing `glass` class

## Verdict

**Ship ONE `glass` class that auto-routes, zero JS.** A rich cross-browser approximation is the
always-on baseline; true SVG refraction is an additive, `@supports`-gated **enhancement** that only
Chromium ever sees. This was proven end-to-end in Chromium, Safari 18.6, and Firefox:

- **Chromium** — the gate activates and `backdrop-filter` resolves to the SVG `url()` → true refraction.
- **Safari / Firefox** — the gate is inactive, so they render the premium approximation and **never go blank**.

This simultaneously (a) kills the #1 DX flaw (mutually-exclusive classes fighting over one
`--tw-glass-filter` slot), (b) fixes the cross-browser regression where today's `.glass` is an
invisible box in Safari/Firefox, and (c) keeps refraction where it actually works — as a bonus, not a
requirement, because **pure CSS in Safari/Firefox can look genuinely premium** (verified, see below).

---

## The problem we're solving

1. **Cross-browser:** today's `.glass` composes an SVG displacement `url()` into `backdrop-filter`.
   That `url()` renders **only in Chromium**. Safari/Firefox drop the *entire* `backdrop-filter` value
   (no blur fallback), so `.glass` is a near-invisible bordered box there. Re-confirmed live this
   session (3×): `CSS.supports('backdrop-filter: url(#x)')` returns **TRUE in Safari** (parse-only) yet
   renders nothing — so no `@supports(backdrop-filter:url())` can gate it.
2. **DX / simplicity:** the surface accreted into many classes that silently override each other.
   `glass-strength-*` and `glass-chromatic-*` both write `--tw-glass-filter`, so the two headline axes
   are mutually exclusive with no error (REVIEW.md HIGH finding). `glass` vs `glass-frosted` forces the
   user to pick a base *per browser*. This is the opposite of "remarkably simple."

---

## Empirical findings (this session, all three engines)

### The auto-routing gate — SOLVED ✅
A single zero-JS `@supports` query distinguishes Chromium from Safari+Firefox. Verified via both
`CSS.supports()` and real `@supports` rules:

| Candidate gate | Chromium | Safari 18.6 | Firefox | Valid |
|---|:--:|:--:|:--:|:--:|
| **`(not (-webkit-hyphens: none)) and (not (-moz-appearance: none))`** | TRUE | FALSE | FALSE | ✅ **chosen** |
| `(background: paint(x))` (Houdini Paint API) | TRUE | FALSE | FALSE | ✅ but riskier |
| `(background: paint(x)) and (not (-moz-appearance: none))` | TRUE | FALSE | FALSE | ✅ but riskier |
| `(overflow: overlay)` | TRUE | TRUE | TRUE | ❌ rejected |

**Why the hyphens+appearance gate, despite all three working today — failure-mode asymmetry:**
refraction is the *gated enhancement*, approximation is the *ungated baseline*, so the worst case must
be "Chromium misses the upgrade," never "Safari blank." The chosen gate is built on legacy prefixed
properties each engine keeps forever — Safari owns `-webkit-hyphens`, Firefox owns `-moz-appearance`,
Chromium lacks both — so it is robustly FALSE in Safari/FF; its only realistic failure is benign
(Chromium someday adds an alias → loses the refraction bonus). The `paint()` gates fail **dangerously**:
if WebKit ever ships Houdini Paint, Safari's gate flips TRUE → enters the refraction branch → blank.
Avoid. (Track WebKit #245510; if SVG-in-backdrop-filter is ever fixed, the gate can be deleted.)

### Render proofs — SOLVED ✅
- The proposed gated `.glass` rendered correctly in all three engines (Chromium computed
  `backdrop-filter` = `url("data:...` → refraction; Safari/FF = premium approximation, never blank),
  side-by-side with today's refraction-only `.glass` which is **blank** in Safari/FF.
- **Approximation realism:** frost + tint + top sheen + asymmetric inset rim + layered depth + baked
  grain reads as a lit, curved glass surface. The **sheen and the asymmetric rim** are the two
  highest-impact ingredients; a pushed "premium-max" (adds a corner specular hotspot + a crisp
  `mask-composite` lit ring) reads as a genuine glass tile catching light.
- **`blur(var(--x))` works in Safari 18.6** → the `glass-blur-*`/saturation/brightness modifiers are
  cross-browser-safe.
- **`mask-composite` gradient rim follows the rounded corners in Safari** → viable as a hero upgrade.
- **Reject the split (`z-index:-1 ::before`) frost topology:** it samples the page in Safari but **not**
  in Chromium (strict backdrop-root). Put **frost on the host**; it costs nothing here.

---

## Recommended architecture

**Frost-on-host baseline + gate-wrapped refraction enhancement.** One axis == one custom property;
no two utilities ever write the same property; never touch Tailwind's `--tw-backdrop-*` slots.

```css
/* ── baseline: always on, every engine, never blank ───────────────────── */
.glass {
  position: relative;
  background: rgb(var(--tw-glass-tint, 255 255 255) / var(--glass-bg-opacity, 0.10));
  -webkit-backdrop-filter:
    blur(var(--tw-glass-blur, 12px))
    saturate(var(--tw-glass-saturation, 1.8))
    brightness(var(--tw-glass-brightness, 1.06));
  backdrop-filter:
    blur(var(--tw-glass-blur, 12px))
    saturate(var(--tw-glass-saturation, 1.8))
    brightness(var(--tw-glass-brightness, 1.06));
  box-shadow:                                   /* asymmetric rim + layered depth */
    inset 0 1px 0 0 rgb(255 255 255 / 0.55),
    inset 0 -1px 0 0 rgb(0 0 0 / 0.18),
    inset 0 0 12px rgb(255 255 255 / 0.06),
    var(--tw-glass-elevation,
      0 1px 2px rgb(0 0 0 / 0.12), 0 8px 24px rgb(0 0 0 / 0.10), 0 16px 40px rgb(0 0 0 / 0.08));
}
.glass::before {                                /* specular sheen + baked grain, ABOVE the frost */
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 1;
  background-image:
    linear-gradient(to bottom,
      rgb(255 255 255 / calc(0.55 * var(--tw-glass-sheen, 1))),
      rgb(255 255 255 / 0.08) 35%, transparent 60%),
    var(--tw-glass-grain);                      /* pre-baked feTurbulence data-URI; renders everywhere */
  background-blend-mode: overlay, overlay;
  background-size: auto, 120px 120px;
}

/* ── Chromium-only refraction upgrade (re-declares backdrop-filter; Safari/FF never see it) ── */
@supports (not (-webkit-hyphens: none)) and (not (-moz-appearance: none)) {
  .glass {
    -webkit-backdrop-filter:
      var(--tw-glass-refract) blur(var(--tw-glass-blur, 12px))
      saturate(var(--tw-glass-saturation, 1.8)) brightness(var(--tw-glass-brightness, 1.06));
    backdrop-filter:
      var(--tw-glass-refract) blur(var(--tw-glass-blur, 12px))
      saturate(var(--tw-glass-saturation, 1.8)) brightness(var(--tw-glass-brightness, 1.06));
  }
}
```

`--tw-glass-refract` is the data-URI displacement filter (default + set by `glass-refract-*` /
`glass-aberration-*`). It lives **only** inside the gate — never in a shared slot, never seen by WebKit.

---

## Proposed API (one base + orthogonal modifiers)

**Base (one class, auto-routing):**
- **`glass`** — premium approximation everywhere; auto-upgrades to true refraction in Chromium.
  Subsumes today's `glass` **and** `glass-frosted`. The user no longer chooses a base per browser.

**Orthogonal modifiers — compose freely, each owns ONE `@property` var, zero silent overrides:**

| Class | Property | Effect |
|---|---|---|
| `glass-tint-*` | `--tw-glass-tint` | surface tint (rgb channels); adaptive light/dark |
| `glass-bg-*` | `--glass-bg-opacity` | tint opacity (fix to `inherits:false`) |
| `glass-blur-*` | `--tw-glass-blur` | frost blur px (cap ~12–16) — *verified in Safari* |
| `glass-saturation-*` | `--tw-glass-saturation` | frost saturation |
| `glass-brightness-*` | `--tw-glass-brightness` | frost brightness |
| `glass-sheen-*` | `--tw-glass-sheen` | specular highlight intensity (NEW) |
| `glass-elevation-{sm,md,lg}` | `--tw-glass-elevation` | depth shadow tier (NEW) |
| `glass-refract-*` | `--tw-glass-refract-scale` | refraction intensity — **Chromium-only**, replaces `glass-strength-*` |
| `glass-aberration-*` | `--tw-glass-aberration` | chromatic aberration as a **sub-property of refraction**, not a rival to strength |
| `glass-rim-hero` | — | swap the inset rim for the crisp `mask-composite` lit ring (optional hero) |

**Companions:** `glass-surface` (keep its `prefers-reduced-transparency` + `forced-colors` fallbacks;
reconsider whether it folds into the base now that the base carries rim+depth). `glass-text` (unchanged).

**This resolves REVIEW.md's HIGH finding:** the displacement `url()` leaves the shared `--tw-glass-filter`
slot entirely; chromatic aberration becomes a *property of* the single refraction filter rather than a
rival utility, so there is exactly one displacement filter and every modifier composes.

---

## Migration (no back-compat assumed — confirm before breaking)
- `glass-frosted` → fold into `glass` (the base is now cross-browser by construction). Keep as a
  deprecated alias for one release if desired.
- `glass-strength-*` → `glass-refract-*` (documented Chromium-only).
- `glass-chromatic-*` → `glass-aberration-*` (now composes with refraction instead of clobbering it).
- Existing `glass-blur/saturation/brightness/bg` → unchanged.

---

## Risks & recommended next steps (before implementing)
1. **Perf pass (Q6, not measured this session):** N approximation panels vs N backdrop-filter panels
   under scripted scroll, incl. iOS Safari; set a documented per-page surface budget + a blur-radius
   ceiling (~12px). The architectural claim (whole stack is paint-only except one blur) is sound but
   unmeasured here.
2. **Grain consistency (Q5):** baked feTurbulence renders in all engines but pixel-identical output
   across Perlin implementations is unverified; sanity-check it doesn't look "dirty" on dark UIs.
3. **Gate longevity:** document exact tested versions (Chromium, Safari 18.6, Firefox) and add a CI
   note. Failure is graceful, but re-validate on major browser releases.
4. **Refraction corner radius (REVIEW MEDIUM):** displacement map rounds at rx=4 while cards use ~16px;
   parameterize per-radius or match the surface radius.
5. **Adaptive contrast:** add `light-dark()` / `prefers-color-scheme` tint so text stays legible over
   busy backgrounds (Apple's adaptive vibrancy is the reference).
6. **Generator tooling — keep `.mjs`, add a type-check:** retain the no-build `node scripts/*.mjs`
   generator (it doubles as the published `tw-glass/filter-builder` entry, so the source file *is* the
   shipped artifact). Close the hand-written `.d.mts` drift risk (REVIEW.md LOW) without adding a build
   step: add `// @ts-check` + JSDoc types to the `.mjs` and run `tsc --checkJs --noEmit` over `scripts/`
   in CI. That type-checks the encoding core (a one-char regex slip silently breaks the filter) and
   asserts the `.d.mts` matches, while `node scripts/*.mjs` keeps Just Working.

## Artifacts
`/tmp/glass-proto/` — `FINDINGS.md` (raw empirical log), `feature-probe.html` (gate matrix),
`glass-ab.html` (routing proof), `arch.html` (var/split/mask probes), `premiummax.html` (premium
ceiling), and `*-{chromium,safari,firefox}.png` captures. Reproduce: `python3 -m http.server 8765`
in that dir, then `capture.sh <page> <tag>`.
