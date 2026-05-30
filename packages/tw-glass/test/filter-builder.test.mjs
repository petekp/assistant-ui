import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GLASS_BACKDROP_FILTER,
  GLASS_FROST_FILTER,
  buildDisplacementMapSvg,
  minifySvg,
  encodeSvgUrl,
  buildStandardFilter,
  buildChromaticFilter,
  toDataUri,
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

test("GLASS_BACKDROP_FILTER composes from tw-glass vars, not Tailwind internals", () => {
  assert.ok(GLASS_BACKDROP_FILTER.includes("var(--tw-glass-filter)"));
  assert.ok(GLASS_BACKDROP_FILTER.includes("blur(var(--tw-glass-blur))"));
  assert.ok(
    GLASS_BACKDROP_FILTER.includes("brightness(var(--tw-glass-brightness))"),
  );
  assert.ok(
    GLASS_BACKDROP_FILTER.includes("saturate(var(--tw-glass-saturation))"),
  );
  assert.ok(!GLASS_BACKDROP_FILTER.includes("--tw-backdrop-"));
});

test("GLASS_FROST_FILTER is frost-only — no displacement url, universally supported", () => {
  assert.ok(GLASS_FROST_FILTER.includes("blur(var(--tw-glass-blur))"));
  assert.ok(
    GLASS_FROST_FILTER.includes("brightness(var(--tw-glass-brightness))"),
  );
  assert.ok(
    GLASS_FROST_FILTER.includes("saturate(var(--tw-glass-saturation))"),
  );
  // The point of glass-frosted: no SVG filter reference, so it renders everywhere.
  assert.ok(!GLASS_FROST_FILTER.includes("--tw-glass-filter"));
  assert.ok(!GLASS_FROST_FILTER.includes("url("));
  assert.ok(!GLASS_FROST_FILTER.includes("--tw-backdrop-"));
});

test("GLASS_BACKDROP_FILTER is the displacement followed by the frost terms", () => {
  assert.ok(GLASS_BACKDROP_FILTER.startsWith("var(--tw-glass-filter) "));
  assert.ok(GLASS_BACKDROP_FILTER.endsWith(GLASS_FROST_FILTER));
});
