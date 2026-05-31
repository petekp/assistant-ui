import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GLASS_FROST,
  glassRefractBackdrop,
  buildDisplacementMapSvg,
  buildGrainSvg,
  minifySvg,
  encodeSvgUrl,
  buildStandardFilter,
  buildChromaticFilter,
  toDataUri,
  toBackgroundUri,
} from "../scripts/filter-builder.mjs";

const map = encodeSvgUrl(buildDisplacementMapSvg());

test("minifySvg strips newlines and collapses whitespace around brackets", () => {
  assert.equal(minifySvg("<a>\n  <b />  </a>"), "<a><b /></a>");
});

test("encodeSvgUrl escapes %, quotes, # and angle brackets", () => {
  const out = encodeSvgUrl('<svg id="a" data="#x">');
  for (const raw of ["<", ">", '"', "#"]) {
    assert.ok(!out.includes(raw), `should not contain raw ${raw}`);
  }
  for (const enc of ["%3C", "%3E", "%22", "%23"]) {
    assert.ok(out.includes(enc), `should contain ${enc}`);
  }
});

test("encodeSvgUrl escapes literal % exactly once (%25, not %2525)", () => {
  assert.equal(encodeSvgUrl("<a>50%</a>"), "%3Ca%3E50%25%3C/a%3E");
});

test('toDataUri wraps as url("data:image/svg+xml,...#f")', () => {
  const uri = toDataUri('<svg><filter id="f"/></svg>');
  assert.ok(uri.startsWith('url("data:image/svg+xml,'));
  assert.ok(uri.endsWith('#f")'));
});

test('toBackgroundUri wraps as url("data:...") with no #f fragment', () => {
  const uri = toBackgroundUri("<svg><rect/></svg>");
  assert.ok(uri.startsWith('url("data:image/svg+xml,'));
  assert.ok(uri.endsWith('")'));
  assert.ok(!uri.endsWith('#f")'));
});

test("toDataUri output contains no raw <, > or double-quote", () => {
  const uri = toDataUri(buildStandardFilter(map, 0.1));
  // strip the wrapping url("...") — `url("` (5 chars) and the trailing `")`.
  const inner = uri.slice('url("'.length, -'")'.length);
  for (const raw of ["<", ">", '"']) {
    assert.ok(!inner.includes(raw), `should not contain raw ${raw}`);
  }
});

test("double-encoding re-escapes the inner map's % exactly once", () => {
  // inner # → %23 (encodeSvgUrl) → %2523 (toDataUri). Guard against
  // under-escaping (%23) and over-escaping (%252523).
  const uri = toDataUri(buildStandardFilter(map, 0.1));
  assert.ok(uri.includes("%2523"));
  assert.ok(!uri.includes("%252523"));
});

test("buildStandardFilter emits one displacement pass at the given scale", () => {
  const svg = buildStandardFilter(map, 0.15);
  assert.equal((svg.match(/feDisplacementMap/g) ?? []).length, 1);
  assert.ok(svg.includes('scale="0.15"'));
  assert.ok(svg.includes('filter id="f"'));
});

test("buildChromaticFilter emits three R/G/B passes blended together", () => {
  const svg = buildChromaticFilter(map, 0.1);
  assert.equal((svg.match(/feDisplacementMap/g) ?? []).length, 3);
  assert.equal((svg.match(/feColorMatrix/g) ?? []).length, 3);
  assert.equal((svg.match(/feBlend/g) ?? []).length, 2);
});

test("buildChromaticFilter scales channels by 1.4 / 1.2 / 1.0", () => {
  const svg = buildChromaticFilter(map, 0.1);
  assert.ok(svg.includes('scale="0.14"'));
  assert.ok(svg.includes('scale="0.12"'));
  assert.ok(svg.includes('scale="0.1"'));
});

test("buildDisplacementMapSvg defaults to a rounded rect", () => {
  const svg = buildDisplacementMapSvg();
  assert.ok(svg.includes("<rect"));
  assert.ok(svg.includes('rx="4"'));
});

test("buildDisplacementMapSvg supports a circle neutral shape", () => {
  assert.ok(buildDisplacementMapSvg({ shape: "circle" }).includes("<circle"));
});

test("buildGrainSvg bakes grayscale fractal noise at a fixed tile + opacity", () => {
  const svg = buildGrainSvg();
  assert.ok(svg.includes('type="fractalNoise"'));
  assert.ok(svg.includes('type="saturate" values="0"'), "grayscale grain");
  assert.ok(svg.includes('width="120" height="120"'), "default tile size");
  assert.ok(svg.includes('opacity="0.18"'), "default baked intensity");
});

test("GLASS_FROST is frost-only — no displacement url, universally supported", () => {
  assert.ok(GLASS_FROST.includes("blur(var(--tw-glass-blur))"));
  assert.ok(GLASS_FROST.includes("saturate(var(--tw-glass-saturation))"));
  assert.ok(GLASS_FROST.includes("brightness(var(--tw-glass-brightness))"));
  // The baseline must render everywhere: no SVG filter reference.
  assert.ok(!GLASS_FROST.includes("url("));
  assert.ok(!GLASS_FROST.includes("--tw-glass-refract"));
  assert.ok(!GLASS_FROST.includes("--tw-backdrop-"));
});

test("glassRefractBackdrop prepends the refraction var (with default) to the frost", () => {
  const def = toDataUri(buildStandardFilter(map, 0.1));
  const value = glassRefractBackdrop(def);
  assert.ok(value.startsWith(`var(--tw-glass-refract, ${def})`));
  assert.ok(value.endsWith(GLASS_FROST));
});
