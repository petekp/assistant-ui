#!/usr/bin/env node
/**
 * Generates src/index.css for tw-glass.
 *
 * `.glass` is ONE auto-routing surface (see REDESIGN.md):
 *   • a premium cross-browser approximation (frost-on-host + tint + specular
 *     sheen + asymmetric rim + layered depth + baked grain) that renders in
 *     every engine and is never blank, plus
 *   • a Chromium-only true-refraction enhancement (an SVG displacement `url()`
 *     re-declared inside an `@supports` gate) that Safari/Firefox never see.
 *
 * The displacement map SVG is URL-encoded once, embedded inside each filter
 * SVG's <feImage href>, then URL-encoded again as a data URI (the
 * "double-encoding" contract in filter-builder.mjs).
 *
 * This file is the source of truth for src/index.css — never hand-edit the CSS.
 * Run: pnpm --filter tw-glass generate   (regenerates + formats)
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GLASS_FROST,
  glassRefractBackdrop,
  buildDisplacementMapSvg,
  encodeSvgUrl,
  buildStandardFilter,
  buildChromaticFilter,
  buildGrainSvg,
  toDataUri,
  toBackgroundUri,
} from "./filter-builder.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Refraction scales ─────────────────────────────────────────────
// Scale is in objectBoundingBox units (fraction of element size).
// refract-20 at scale 0.10 matches the tested "standard" look.

const REFRACT_SCALES = [
  { name: "5", scale: 0.03 },
  { name: "10", scale: 0.05 },
  { name: "20", scale: 0.1 },
  { name: "30", scale: 0.15 },
  { name: "40", scale: 0.2 },
  { name: "50", scale: 0.25 },
];

const DEFAULT_REFRACT = "20";

// ─── Tints (surface tint as space-separated RGB channels) ──────────
// Channel triples mirror Tailwind's 500 shades; white/black are the workhorses.

const TINTS = [
  { name: "white", channels: "255 255 255" },
  { name: "black", channels: "0 0 0" },
  { name: "slate", channels: "100 116 139" },
  { name: "blue", channels: "59 130 246" },
  { name: "emerald", channels: "16 185 129" },
  { name: "amber", channels: "245 158 11" },
  { name: "rose", channels: "244 63 94" },
  { name: "violet", channels: "139 92 246" },
];

// ─── Elevation tiers (layered depth shadow) ────────────────────────
// `md` matches the base default so `glass-elevation-md` is a no-op restate.

const ELEVATION_MD =
  "0 1px 2px rgb(0 0 0 / 0.12), 0 8px 24px rgb(0 0 0 / 0.10), 0 16px 40px rgb(0 0 0 / 0.08)";
const ELEVATIONS = [
  {
    name: "sm",
    shadow: "0 1px 2px rgb(0 0 0 / 0.12), 0 2px 8px rgb(0 0 0 / 0.10)",
  },
  { name: "md", shadow: ELEVATION_MD },
  {
    name: "lg",
    shadow:
      "0 2px 4px rgb(0 0 0 / 0.14), 0 12px 32px rgb(0 0 0 / 0.12), 0 24px 60px rgb(0 0 0 / 0.10)",
  },
];

// The asymmetric inset rim (top-lit, bottom-shaded) + faint inner glow that
// reads as a curved, lit glass edge. Prepended to the elevation in box-shadow.
const RIM =
  "inset 0 1px 0 0 rgb(255 255 255 / 0.55), inset 0 -1px 0 0 rgb(0 0 0 / 0.18), inset 0 0 12px rgb(255 255 255 / 0.06)";

// ─── Derived SVG values ────────────────────────────────────────────

const mapUrlEncoded = encodeSvgUrl(buildDisplacementMapSvg());
const defaultScale = REFRACT_SCALES.find(
  (s) => s.name === DEFAULT_REFRACT,
).scale;
const defaultRefractUri = toDataUri(
  buildStandardFilter(mapUrlEncoded, defaultScale),
);
const grainUri = toBackgroundUri(buildGrainSvg());

// The specular sheen gradient (top-down highlight, scaled by --tw-glass-sheen).
const SHEEN =
  "linear-gradient(to bottom, rgb(255 255 255 / calc(0.55 * var(--tw-glass-sheen, 1))), rgb(255 255 255 / 0.08) 35%, transparent 60%)";

// ─── Emit ──────────────────────────────────────────────────────────

const lines = [];
const emit = (s = "") => lines.push(s);

emit(`/*`);
emit(` * tw-glass — Tailwind CSS v4 plugin for premium glass surfaces`);
emit(` *`);
emit(` * GENERATED FILE — do not edit by hand.`);
emit(` * Source: scripts/generate.mjs + scripts/filter-builder.mjs`);
emit(` * Regenerate: pnpm --filter tw-glass generate`);
emit(` *`);
emit(` * \`glass\` is ONE auto-routing class. Every engine gets a premium`);
emit(
  ` * approximation (frost + tint + specular sheen + asymmetric rim + layered`,
);
emit(
  ` * depth + baked grain). Chromium additionally gets true SVG refraction via`,
);
emit(
  ` * an @supports gate; Safari/Firefox never see the url(), so they render the`,
);
emit(
  ` * approximation instead of going blank. No JavaScript — just CSS classes.`,
);
emit(` *`);
emit(` * Usage:`);
emit(` *   @import "tw-glass";`);
emit(` *`);
emit(
  ` *   <div class="glass rounded-xl p-6">                 <!-- auto-routing glass -->`,
);
emit(
  ` *   <div class="glass glass-tint-black rounded-xl">    <!-- smoked glass -->`,
);
emit(
  ` *   <div class="glass glass-refract-40">               <!-- stronger refraction (Chromium) -->`,
);
emit(
  ` *   <div class="glass glass-aberration-20">            <!-- chromatic refraction (Chromium) -->`,
);
emit(
  ` *   <div class="glass glass-blur-8 glass-saturation-160"> <!-- frost tuning -->`,
);
emit(
  ` *   <div class="glass glass-elevation-lg glass-sheen-150"> <!-- depth + highlight -->`,
);
emit(
  ` *   <h1 class="glass-text" style="background-image:url(photo.jpg)"> <!-- glass text -->`,
);
emit(` */`);
emit();

// ── Custom properties ──────────────────────────────────────────────
emit(`/* ── Custom Properties ──────────────────────────────────────── */`);
emit(`/*`);
emit(
  ` * Typed (@property) so they animate and resist inheritance. --tw-glass-tint`,
);
emit(
  ` * (RGB channels), --tw-glass-grain (url), --tw-glass-elevation (shadow list)`,
);
emit(
  ` * and --tw-glass-refract (filter url) are set per-element on .glass / its`,
);
emit(
  ` * modifiers instead — their value grammars don't map to a single @property`,
);
emit(` * <syntax>.`);
emit(` */`);
emit();
const cssProps = [
  { name: "--tw-glass-blur", syntax: "<length>", initial: "12px" },
  { name: "--tw-glass-saturation", syntax: "<number>", initial: "1.8" },
  { name: "--tw-glass-brightness", syntax: "<number>", initial: "1.06" },
  { name: "--tw-glass-sheen", syntax: "<number>", initial: "1" },
  { name: "--tw-glass-bg-opacity", syntax: "<number>", initial: "0.1" },
];
for (const { name, syntax, initial } of cssProps) {
  emit(`@property ${name} {`);
  emit(`  syntax: "${syntax}";`);
  emit(`  inherits: false;`);
  emit(`  initial-value: ${initial};`);
  emit(`}`);
  emit();
}

// ── Base utility ───────────────────────────────────────────────────
// Tailwind v4 "owns" backdrop-filter (it strips the property from the utilities
// layer), so the visual rules live in @layer components, which Tailwind passes
// through untouched. The @utility block only seeds per-element defaults that the
// modifiers override (tint, grain) so they participate in Tailwind's ordering.
emit(`/* ── Base Glass Surface ─────────────────────────────────────── */`);
emit();
emit(`@utility glass {`);
emit(`  --tw-glass-tint: 255 255 255;`);
emit(`  --tw-glass-grain: ${grainUri};`);
emit(`}`);
emit();
emit(
  `/* Companion rules — @layer components is not stripped by Tailwind v4. */`,
);
emit(`@layer components {`);
emit(`  .glass {`);
emit(`    position: relative;`);
emit(`    isolation: isolate;`);
emit(
  `    background: rgb(var(--tw-glass-tint, 255 255 255) / var(--tw-glass-bg-opacity, 0.1));`,
);
emit(`    /* Baseline frost — renders in every engine, never blank. */`);
emit(`    -webkit-backdrop-filter: ${GLASS_FROST};`);
emit(`    backdrop-filter: ${GLASS_FROST};`);
emit(`    /* Asymmetric lit rim + layered depth. */`);
emit(`    box-shadow: ${RIM}, var(--tw-glass-elevation, ${ELEVATION_MD});`);
emit(`  }`);
emit();
emit(
  `  /* Specular sheen + baked grain, painted on the surface beneath content`,
);
emit(
  `     (z-index:-1, inside the .glass stacking context) so text stays legible. */`,
);
emit(`  .glass::before {`);
emit(`    content: "";`);
emit(`    position: absolute;`);
emit(`    inset: 0;`);
emit(`    z-index: -1;`);
emit(`    border-radius: inherit;`);
emit(`    pointer-events: none;`);
emit(`    background-image: ${SHEEN}, var(--tw-glass-grain);`);
emit(`    background-repeat: no-repeat, repeat;`);
emit(`    background-size: 100% 100%, 120px 120px;`);
emit(`    background-blend-mode: overlay, overlay;`);
emit(`  }`);
emit();
emit(
  `  /* Chromium-only true refraction. The gate is TRUE only in Chromium, so`,
);
emit(
  `     Safari/Firefox never see the url() and keep the baseline frost above. */`,
);
emit(
  `  @supports (not (-webkit-hyphens: none)) and (not (-moz-appearance: none)) {`,
);
emit(`    .glass {`);
emit(
  `      -webkit-backdrop-filter: ${glassRefractBackdrop(defaultRefractUri)};`,
);
emit(`      backdrop-filter: ${glassRefractBackdrop(defaultRefractUri)};`);
emit(`    }`);
emit(`  }`);
emit(`}`);
emit();

// ── Accessibility fallbacks (folded into the base) ─────────────────
emit(`/* ── Accessibility Fallbacks ────────────────────────────────── */`);
emit(`/*`);
emit(
  ` * Where translucency is unwanted or the effect can't render, fall back to`,
);
emit(
  ` * an opaque, clearly-defined panel so content stays legible. Folded into`,
);
emit(` * the base so every .glass is accessible by default — no opt-in class.`);
emit(` */`);
emit(`@media (prefers-reduced-transparency: reduce) {`);
emit(`  .glass {`);
emit(`    background: rgb(var(--tw-glass-tint, 255 255 255) / 0.9);`);
emit(`    -webkit-backdrop-filter: none;`);
emit(`    backdrop-filter: none;`);
emit(`  }`);
emit(`  .glass::before {`);
emit(`    display: none;`);
emit(`  }`);
emit(`}`);
emit();
emit(`@media (forced-colors: active) {`);
emit(`  .glass {`);
emit(`    background: Canvas;`);
emit(`    border: 1px solid CanvasText;`);
emit(`    box-shadow: none;`);
emit(`    -webkit-backdrop-filter: none;`);
emit(`    backdrop-filter: none;`);
emit(`  }`);
emit(`  .glass::before {`);
emit(`    display: none;`);
emit(`  }`);
emit(`}`);
emit();

// ── Tint ───────────────────────────────────────────────────────────
emit(`/* ── Tint (surface color; RGB channels) ─────────────────────── */`);
emit(`/* Override --tw-glass-tint directly for arbitrary colors, e.g.`);
emit(`   style="--tw-glass-tint: 12 74 110". */`);
emit();
for (const { name, channels } of TINTS) {
  emit(`@utility glass-tint-${name} {`);
  emit(`  --tw-glass-tint: ${channels};`);
  emit(`}`);
  emit();
}

// ── Elevation ──────────────────────────────────────────────────────
emit(`/* ── Elevation (layered depth) ──────────────────────────────── */`);
emit();
for (const { name, shadow } of ELEVATIONS) {
  emit(`@utility glass-elevation-${name} {`);
  emit(`  --tw-glass-elevation: ${shadow};`);
  emit(`}`);
  emit();
}

// ── Frost modifiers ────────────────────────────────────────────────
emit(`/* ── Frost & Sheen Modifiers ────────────────────────────────── */`);
emit(`/* Each accepts a bare scale (glass-blur-8) or an arbitrary value`);
emit(
  `   (glass-blur-[7px]); the arbitrary branch is taken as the raw CSS value. */`,
);
emit();
emit(`@utility glass-blur-* {`);
emit(`  --tw-glass-blur: --value([length]);`);
emit(`  --tw-glass-blur: calc(--value(number) * 1px);`);
emit(`}`);
emit();
emit(`@utility glass-saturation-* {`);
emit(`  --tw-glass-saturation: --value([number]);`);
emit(`  --tw-glass-saturation: calc(--value(number) / 100);`);
emit(`}`);
emit();
emit(`@utility glass-brightness-* {`);
emit(`  --tw-glass-brightness: --value([number]);`);
emit(`  --tw-glass-brightness: calc(--value(number) / 100);`);
emit(`}`);
emit();
emit(`@utility glass-sheen-* {`);
emit(`  --tw-glass-sheen: --value([number]);`);
emit(`  --tw-glass-sheen: calc(--value(number) / 100);`);
emit(`}`);
emit();
emit(`@utility glass-bg-* {`);
emit(`  --tw-glass-bg-opacity: --value([number]);`);
emit(`  --tw-glass-bg-opacity: calc(--value(number) * 0.01);`);
emit(`}`);
emit();

// ── Refraction (Chromium-only) ─────────────────────────────────────
emit(`/* ── Refraction (Chromium-only) ─────────────────────────────── */`);
emit(`/*`);
emit(
  ` * glass-refract-* and glass-aberration-* both define the single refraction`,
);
emit(
  ` * filter (--tw-glass-refract), read only inside the Chromium gate above.`,
);
emit(` * Aberration is the chromatic flavor of refraction, so the two are`);
emit(
  ` * alternatives — pick one. They are inert in Safari/Firefox (which keep the`,
);
emit(` * baseline frost) by design.`);
emit(` */`);
emit();
for (const { name, scale } of REFRACT_SCALES) {
  emit(`@utility glass-refract-${name} {`);
  emit(
    `  --tw-glass-refract: ${toDataUri(buildStandardFilter(mapUrlEncoded, scale))};`,
  );
  emit(`}`);
  emit();
}
for (const { name, scale } of REFRACT_SCALES) {
  emit(`@utility glass-aberration-${name} {`);
  emit(
    `  --tw-glass-refract: ${toDataUri(buildChromaticFilter(mapUrlEncoded, scale))};`,
  );
  emit(`}`);
  emit();
}

// ── Hero rim ───────────────────────────────────────────────────────
emit(`/* ── Hero Rim (crisp lit ring via mask-composite) ───────────── */`);
emit(
  `/* Optional upgrade: a 1px gradient ring that follows the rounded corners,`,
);
emit(`   layered over the base rim for a sharper "lit edge". */`);
emit(`@layer components {`);
emit(`  .glass-rim-hero::after {`);
emit(`    content: "";`);
emit(`    position: absolute;`);
emit(`    inset: 0;`);
emit(`    z-index: -1;`);
emit(`    border-radius: inherit;`);
emit(`    padding: 1px;`);
emit(`    pointer-events: none;`);
emit(`    background: linear-gradient(`);
emit(`      to bottom,`);
emit(`      rgb(255 255 255 / 0.7),`);
emit(`      rgb(255 255 255 / 0.05) 40%,`);
emit(`      rgb(0 0 0 / 0.15)`);
emit(`    );`);
emit(`    -webkit-mask:`);
emit(`      linear-gradient(#000 0 0) content-box,`);
emit(`      linear-gradient(#000 0 0);`);
emit(`    mask:`);
emit(`      linear-gradient(#000 0 0) content-box,`);
emit(`      linear-gradient(#000 0 0);`);
emit(`    -webkit-mask-composite: xor;`);
emit(`    mask-composite: exclude;`);
emit(`  }`);
emit(`}`);
emit();

// ── Glass text ─────────────────────────────────────────────────────
emit(`/* ── Glass Text Effect ──────────────────────────────────────── */`);
emit(`/*`);
emit(
  ` * Clips a background image to the text shape. Set background-image on the`,
);
emit(` * element; text is only made transparent where background-clip:text is`);
emit(` * supported, so unsupported browsers keep visible text.`);
emit(` *`);
emit(` * Usage:`);
emit(
  ` *   <h1 class="glass-text" style="background-image: url(photo.jpg)">tw-glass</h1>`,
);
emit(` */`);
emit();
emit(`@utility glass-text {`);
emit(`  background-size: cover;`);
emit(`  background-position: center;`);
emit(`}`);
emit();
emit(
  `@supports ((-webkit-background-clip: text) or (background-clip: text)) {`,
);
emit(`  .glass-text {`);
emit(`    color: transparent;`);
emit(`    -webkit-background-clip: text;`);
emit(`    background-clip: text;`);
emit(`  }`);
emit(`}`);

const css = `${lines.join("\n")}\n`;
const outPath = resolve(__dirname, "../src/index.css");
writeFileSync(outPath, css);

console.log(`✓ Generated ${outPath}`);
console.log(
  `  ${REFRACT_SCALES.length} refract + ${REFRACT_SCALES.length} aberration levels`,
);
console.log(`  ${TINTS.length} tints, ${ELEVATIONS.length} elevation tiers`);
console.log(`  ${(css.length / 1024).toFixed(1)}KB total`);
