#!/usr/bin/env node
/**
 * Generates src/index.css for tw-glass.
 *
 * The displacement map SVG is URL-encoded once, then embedded inside each
 * filter SVG's <feImage href>. The outer filter SVG is URL-encoded again as a
 * data URI for use in backdrop-filter: url("data:...#f").
 *
 * This file is the source of truth for src/index.css — never hand-edit the CSS.
 * Run: pnpm --filter tw-glass generate   (regenerates + formats)
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GLASS_BACKDROP_FILTER,
  GLASS_FROST_FILTER,
  buildDisplacementMapSvg,
  encodeSvgUrl,
  buildStandardFilter,
  buildChromaticFilter,
  toDataUri,
} from "./filter-builder.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Displacement Map ──────────────────────────────────────────────

const DISPLACEMENT_MAP_SVG = buildDisplacementMapSvg();
const mapUrlEncoded = encodeSvgUrl(DISPLACEMENT_MAP_SVG);

// ─── Strength Levels ───────────────────────────────────────────────
// Scale is in objectBoundingBox units (fraction of element size).
// strength-20 at scale 0.10 matches the tested "standard" look.

const STRENGTHS = [
  { name: "5", scale: 0.03 },
  { name: "10", scale: 0.05 },
  { name: "20", scale: 0.1 },
  { name: "30", scale: 0.15 },
  { name: "40", scale: 0.2 },
  { name: "50", scale: 0.25 },
];

const DEFAULT_STRENGTH = "20";

// ─── Filter Builders ───────────────────────────────────────────────
// (imported from filter-builder.mjs)

// ─── Generate CSS ──────────────────────────────────────────────────

const defaultScale = STRENGTHS.find((s) => s.name === DEFAULT_STRENGTH).scale;
const defaultFilterUri = toDataUri(
  buildStandardFilter(mapUrlEncoded, defaultScale),
);

const lines = [];
const emit = (s = "") => lines.push(s);

emit(`/*`);
emit(` * tw-glass — Tailwind CSS v4 plugin for glass refraction effects`);
emit(` *`);
emit(` * GENERATED FILE — do not edit by hand.`);
emit(` * Source: scripts/generate.mjs + scripts/filter-builder.mjs`);
emit(` * Regenerate: pnpm --filter tw-glass generate`);
emit(` *`);
emit(
  ` * Uses SVG displacement maps with filterUnits="objectBoundingBox" to create`,
);
emit(
  ` * glass-like refraction that scales with element size. No JavaScript, no`,
);
emit(` * companion components — just CSS classes.`);
emit(` *`);
emit(
  ` * Refraction (the url() SVG filter) renders in Chromium (Chrome/Edge) only.`,
);
emit(
  ` * Safari and Firefox do not apply an SVG filter reference in backdrop-filter,`,
);
emit(
  ` * and because it is composed into a single backdrop-filter value there is no`,
);
emit(
  ` * plain-blur fallback — a bare .glass shows no backdrop effect there. Use`,
);
emit(
  ` * glass-surface for a panel that stays visible cross-browser. See README.`,
);
emit(` *`);
emit(` * Usage:`);
emit(` *   @import "tw-glass";`);
emit(` *`);
emit(
  ` *   <div class="glass">                              <!-- default refraction -->`,
);
emit(
  ` *   <div class="glass glass-strength-40">             <!-- stronger -->`,
);
emit(
  ` *   <div class="glass glass-chromatic-20">            <!-- RGB splitting (replaces strength) -->`,
);
emit(
  ` *   <div class="glass glass-blur-4">                  <!-- custom blur (px) -->`,
);
emit(
  ` *   <div class="glass glass-saturation-150">          <!-- 150% saturation -->`,
);
emit(
  ` *   <div class="glass glass-brightness-110">          <!-- 110% brightness -->`,
);
emit(
  ` *   <div class="glass glass-surface">                 <!-- frosted surface -->`,
);
emit(
  ` *   <div class="glass-frosted">                       <!-- universal frosted glass (no refraction) -->`,
);
emit(
  ` *   <h1 class="glass-text">                              <!-- glass text effect -->`,
);
emit(` */`);
emit();

// Custom properties
emit(`/* ── Custom Properties ──────────────────────────────────────── */`);
emit();
emit(`@property --tw-glass-blur {`);
emit(`  syntax: "<length>";`);
emit(`  inherits: false;`);
emit(`  initial-value: 2px;`);
emit(`}`);
emit();
emit(`@property --tw-glass-brightness {`);
emit(`  syntax: "<number>";`);
emit(`  inherits: false;`);
emit(`  initial-value: 1.05;`);
emit(`}`);
emit();
emit(`@property --tw-glass-saturation {`);
emit(`  syntax: "<number>";`);
emit(`  inherits: false;`);
emit(`  initial-value: 1.2;`);
emit(`}`);
emit();
emit(`@property --glass-bg-opacity {`);
emit(`  syntax: "<number>";`);
emit(`  inherits: false;`);
emit(`  initial-value: 0.08;`);
emit(`}`);
emit();

// ─── Backdrop composition ─────────────────────────────────────────────
// Tailwind v4 "owns" the backdrop-filter property: it strips any
// backdrop-filter declaration from utility-layer CSS (@utility / @layer
// utilities) and only emits it via its own internal composition. We work
// around that by applying backdrop-filter in @layer components, which Tailwind
// passes through untouched.
//
// The value is composed from tw-glass's OWN custom properties
// (--tw-glass-filter / --tw-glass-blur / --tw-glass-brightness /
// --tw-glass-saturation), NOT Tailwind's private --tw-backdrop-* internals.
// This keeps the effect from breaking if Tailwind renames its internals, and
// stops `glass` from fighting Tailwind's own backdrop-* utilities over a shared
// variable. (Note: a single element can still only have one backdrop-filter, so
// applying `glass` and e.g. `backdrop-blur-md` together is unsupported — use the
// `glass-blur-*` modifier instead. See README.)

emit(`/* ── Base Glass Utility ─────────────────────────────────────── */`);
emit();
emit(`@utility glass {`);
emit(`  --tw-glass-filter: ${defaultFilterUri};`);
emit(`}`);
emit();
emit(`/* Companion rule — @layer components is not stripped by Tailwind v4 */`);
emit(`@layer components {`);
emit(`  .glass {`);
emit(`    -webkit-backdrop-filter: ${GLASS_BACKDROP_FILTER};`);
emit(`    backdrop-filter: ${GLASS_BACKDROP_FILTER};`);
emit(`  }`);
emit(`}`);
emit();

// Frosted glass — the cross-browser base
emit(`/* ── Frosted Glass (cross-browser; no refraction) ──────────── */`);
emit(`/*`);
emit(
  ` * glass-frosted is the universal alternative to glass: a plain frosted blur`,
);
emit(
  ` * (no SVG displacement) that renders in every engine, including Safari and`,
);
emit(` * Firefox. An element gets a single backdrop-filter, so glass and`);
emit(
  ` * glass-frosted are MUTUALLY EXCLUSIVE — pick one base per element; don't`,
);
emit(` * combine them. It honors the same glass-blur-* / glass-brightness-* /`);
emit(` * glass-saturation-* modifiers and composes with glass-surface.`);
emit(` */`);
emit(`@layer components {`);
emit(`  .glass-frosted {`);
emit(`    -webkit-backdrop-filter: ${GLASS_FROST_FILTER};`);
emit(`    backdrop-filter: ${GLASS_FROST_FILTER};`);
emit(`  }`);
emit(`}`);
emit();

// Surface styling
emit(`/* ── Surface Styling (compose with "glass") ────────────────── */`);
emit(`/*`);
emit(` * --tw-glass-tint is the surface tint as space-separated RGB channels`);
emit(
  ` * (default white). Override it for smoked/dark or brand-colored glass, e.g.`,
);
emit(` *   <div class="glass glass-surface" style="--tw-glass-tint: 0 0 0">`);
emit(` */`);
emit();
emit(`@utility glass-surface {`);
emit(
  `  background: rgb(var(--tw-glass-tint, 255 255 255) / var(--glass-bg-opacity));`,
);
emit(`  box-shadow:`);
emit(`    inset 0 0 0 1px rgb(255 255 255 / 0.15),`);
emit(`    inset 0 1px 0 rgb(255 255 255 / 0.25),`);
emit(`    0 8px 32px rgb(0 0 0 / 0.12);`);
emit(`}`);
emit();
emit(`/*`);
emit(
  ` * Accessibility fallbacks. Where the backdrop refraction can't render or`,
);
emit(
  ` * translucency is unwanted, fall back to an opaque, clearly-bordered panel`,
);
emit(` * so content over glass-surface stays legible.`);
emit(` */`);
emit(`@media (prefers-reduced-transparency: reduce) {`);
emit(`  .glass-surface {`);
emit(`    background: rgb(var(--tw-glass-tint, 255 255 255) / 0.9);`);
emit(`  }`);
emit(`}`);
emit();
emit(`@media (forced-colors: active) {`);
emit(`  .glass-surface {`);
emit(`    background: Canvas;`);
emit(`    border: 1px solid CanvasText;`);
emit(`    box-shadow: none;`);
emit(`  }`);
emit(`}`);
emit();

// Strength levels
emit(`/* ── Displacement Strength ──────────────────────────────────── */`);
emit(`/*`);
emit(
  ` * glass-strength-* and glass-chromatic-* both set --tw-glass-filter, so they`,
);
emit(
  ` * are MUTUALLY EXCLUSIVE — applying both keeps only one (chromatic is emitted`,
);
emit(
  ` * last, so it wins). Chromatic already includes displacement, so treat it as`,
);
emit(` * a richer alternative to strength, not an addition. Pick one.`);
emit(` */`);
emit();
for (const { name, scale } of STRENGTHS) {
  const uri = toDataUri(buildStandardFilter(mapUrlEncoded, scale));
  emit(`@utility glass-strength-${name} {`);
  emit(`  --tw-glass-filter: ${uri};`);
  emit(`}`);
  emit();
}

// Chromatic levels
emit(`/* ── Chromatic Aberration (RGB channel splitting) ──────────── */`);
emit(
  `/* Includes displacement — use INSTEAD of glass-strength-*, not with it. */`,
);
emit();
for (const { name, scale } of STRENGTHS) {
  const uri = toDataUri(buildChromaticFilter(mapUrlEncoded, scale));
  emit(`@utility glass-chromatic-${name} {`);
  emit(`  --tw-glass-filter: ${uri};`);
  emit(`}`);
  emit();
}

// ─── Continuous Modifiers ─────────────────────────────────────
// Each accepts the bare numeric scale (e.g. glass-blur-4) and an arbitrary
// value (e.g. glass-blur-[7px]); the arbitrary branch is taken as the raw CSS
// value, the bare branch goes through the friendly scale.
emit(`/* ── Continuous Modifiers ───────────────────────────────────── */`);
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
emit(`@utility glass-bg-* {`);
emit(`  --glass-bg-opacity: --value([number]);`);
emit(`  --glass-bg-opacity: calc(--value(number) * 0.01);`);
emit(`}`);
emit();
emit(`/* ── Glass Text Effect ─────────────────────────────────────── */`);
emit(`/*`);
emit(
  ` * Shows a background image through the text shape, like looking through`,
);
emit(
  ` * glass letters. Set \`background-image\` on the element; the text is only`,
);
emit(
  ` * clipped (and made transparent) where background-clip:text is supported, so`,
);
emit(` * unsupported browsers keep visible text in its normal color.`);
emit(` *`);
emit(
  ` * background-attachment: fixed gives a parallax-window effect on desktop but`,
);
emit(` * is unreliable on iOS Safari (rendered as scroll).`);
emit(` *`);
emit(` * Usage:`);
emit(` *   <h1 class="glass-text" style="background-image: url(photo.jpg)">`);
emit(` *     tw-glass`);
emit(` *   </h1>`);
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
console.log(`  ${STRENGTHS.length} standard strength levels`);
console.log(`  ${STRENGTHS.length} chromatic strength levels`);
console.log(`  ${(css.length / 1024).toFixed(1)}KB total`);
