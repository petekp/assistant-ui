/**
 * Shared SVG filter-building functions for tw-glass.
 *
 * Used by the Node generator (scripts/generate.mjs). All functions are pure —
 * no Node APIs, no side effects — so they also run unchanged in a browser tuner.
 *
 * ── Architecture (see REDESIGN.md) ─────────────────────────────────
 * `.glass` ships ONE auto-routing surface:
 *   • a premium cross-browser *approximation* (frost-on-host blur/saturate/
 *     brightness + tint + specular sheen + asymmetric rim + layered depth +
 *     baked grain) that renders in every engine and is never blank, plus
 *   • a Chromium-only *true refraction* enhancement (an SVG displacement
 *     `url()` re-declared inside an `@supports` gate) that Safari/Firefox never
 *     see, so they keep the approximation instead of dropping the whole filter.
 *
 * This file owns the two SVG halves: the displacement filters (refraction) and
 * the baked feTurbulence grain. The CSS scaffolding lives in generate.mjs.
 */

// ─── Frost (the always-on, cross-browser backdrop-filter) ──────────

/**
 * The "frost" backdrop-filter: plain blur / saturate / brightness, composed
 * from tw-glass's OWN custom properties (never Tailwind's `--tw-backdrop-*`
 * internals). Every engine renders these filter functions, so this is the
 * baseline `.glass` applies on its own; Chromium re-declares it with the
 * displacement `url()` prepended inside the refraction gate.
 *
 * Each term reads a continuous modifier, falling back to its @property default.
 */
export const GLASS_FROST = [
  "blur(var(--tw-glass-blur))",
  "saturate(var(--tw-glass-saturation))",
  "brightness(var(--tw-glass-brightness))",
].join(" ");

/**
 * Build the gated, Chromium-only backdrop-filter value: the refraction filter
 * (`--tw-glass-refract`, defaulting to `defaultRefractUri`) followed by the
 * frost terms. Lives only inside the `@supports` gate; Safari/FF never see it.
 *
 * @param {string} defaultRefractUri - `url("data:...#f")` used when no
 *   `glass-refract-*` / `glass-aberration-*` modifier sets `--tw-glass-refract`.
 * @returns {string} backdrop-filter value
 */
export function glassRefractBackdrop(defaultRefractUri) {
  return `var(--tw-glass-refract, ${defaultRefractUri}) ${GLASS_FROST}`;
}

// ─── Displacement Map ──────────────────────────────────────────────

/**
 * Build the inner displacement-map SVG string.
 *
 * @param {object} [opts]
 * @param {number} [opts.inset]        - Inner rect inset from edges (viewBox units out of 100)
 * @param {number} [opts.cornerRadius] - Inner rect corner radius
 * @param {number} [opts.innerBlur]    - Gaussian blur for the inner (neutral) rect
 * @param {number} [opts.outerBlur]    - Gaussian blur wrapping the whole group
 * @param {"rect"|"circle"} [opts.shape] - Neutral shape
 * @returns {string} SVG markup
 */
export function buildDisplacementMapSvg({
  inset = 8,
  cornerRadius = 4,
  innerBlur = 4,
  outerBlur = 1.5,
  shape = "rect",
} = {}) {
  const size = 100 - inset * 2; // width/height of inner rect
  const neutralShape =
    shape === "circle"
      ? `<circle cx="50" cy="50" r="${size / 2}" fill="#808080" filter="url(#ib)"/>`
      : `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="#808080" filter="url(#ib)"/>`;
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">',
    "<defs>",
    '<linearGradient id="x" x1="5%" y1="0" x2="95%" y2="0">',
    '<stop offset="0%" stop-color="#F00"/>',
    '<stop offset="100%" stop-color="#000"/>',
    "</linearGradient>",
    '<linearGradient id="y" x1="0" y1="5%" x2="0" y2="95%">',
    '<stop offset="0%" stop-color="#0F0"/>',
    '<stop offset="100%" stop-color="#000"/>',
    "</linearGradient>",
    `<filter id="ob"><feGaussianBlur stdDeviation="${outerBlur}"/></filter>`,
    `<filter id="ib"><feGaussianBlur stdDeviation="${innerBlur}"/></filter>`,
    "</defs>",
    '<rect width="100" height="100" fill="#808080"/>',
    '<g filter="url(#ob)">',
    '<rect width="100" height="100" fill="#000080"/>',
    '<rect width="100" height="100" fill="url(#y)" style="mix-blend-mode:screen"/>',
    '<rect width="100" height="100" fill="url(#x)" style="mix-blend-mode:screen"/>',
    neutralShape,
    "</g>",
    "</svg>",
  ].join("");
}

// ─── Grain (baked feTurbulence, renders in every engine) ───────────

/**
 * Build a baked film-grain SVG: fractal-noise turbulence desaturated to
 * grayscale (so it never tints dark UIs) at a fixed tile size, with the
 * intensity baked into the rect's opacity. Used as a `background-image` on
 * `.glass::before` and blended with `background-blend-mode: overlay`.
 *
 * @param {object} [opts]
 * @param {number} [opts.size]          - Tile size in px (background-size matches)
 * @param {number} [opts.baseFrequency] - feTurbulence base frequency (grain fineness)
 * @param {number} [opts.numOctaves]    - feTurbulence octaves (grain richness)
 * @param {number} [opts.opacity]       - Baked grain strength (0..1)
 * @returns {string} SVG markup
 */
export function buildGrainSvg({
  size = 120,
  baseFrequency = 0.9,
  numOctaves = 2,
  opacity = 0.18,
} = {}) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">`,
    '<filter id="g" x="0" y="0" width="100%" height="100%">',
    `<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" stitchTiles="stitch"/>`,
    '<feColorMatrix type="saturate" values="0"/>',
    "</filter>",
    `<rect width="100%" height="100%" filter="url(#g)" opacity="${opacity}"/>`,
    "</svg>",
  ].join("");
}

// ─── Encoding (isomorphic) ─────────────────────────────────────────

/**
 * Strip newlines and collapse whitespace around angle brackets. Shared by both
 * encoders so their pre-processing can never drift apart.
 *
 * @param {string} svg
 * @returns {string}
 */
export function minifySvg(svg) {
  return svg.replace(/\n/g, "").replace(/\s*([<>])\s*/g, "$1");
}

/**
 * URL-encode an SVG string instead of Base64 encoding. Works in both Node and browser.
 * This is significantly smaller over the wire when gzip/brotli compressed.
 *
 * Escapes quotes (`"`/`'`) as well as the data-URI-unsafe characters, because
 * the result is embedded inside a `<feImage href="...">` attribute that is
 * itself percent-encoded again by {@link toDataUri} (the "double-encoding"
 * contract — see the note there).
 *
 * @param {string} svg
 * @returns {string}
 */
export function encodeSvgUrl(svg) {
  return minifySvg(svg)
    .replace(/%/g, "%25")
    .replace(/"/g, "%22")
    .replace(/'/g, "%27")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, "%20");
}

// ─── Filter Builders ───────────────────────────────────────────────

/**
 * @param {string} mapUrlEncoded
 * @returns {string}
 */
function feImage(mapUrlEncoded) {
  return [
    `<feImage href="data:image/svg+xml,${mapUrlEncoded}"`,
    ` x="0" y="0" width="1" height="1" preserveAspectRatio="none" result="map"/>`,
  ].join("");
}

function filterOpen() {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg"><defs>',
    '<filter id="f" filterUnits="objectBoundingBox"',
    ' primitiveUnits="objectBoundingBox"',
    ' color-interpolation-filters="sRGB">',
  ].join("");
}

function filterClose() {
  return "</filter></defs></svg>";
}

/**
 * Build a standard (single-pass) displacement filter SVG.
 *
 * @param {string} mapUrlEncoded - URL-encoded displacement map SVG (from {@link encodeSvgUrl})
 * @param {number} scale         - Displacement scale (objectBoundingBox fraction)
 * @returns {string} Complete filter SVG
 */
export function buildStandardFilter(mapUrlEncoded, scale) {
  return [
    filterOpen(),
    feImage(mapUrlEncoded),
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}"`,
    ` xChannelSelector="R" yChannelSelector="G"/>`,
    filterClose(),
  ].join("");
}

/**
 * Build a chromatic (3-pass RGB split) displacement filter SVG.
 *
 * @param {string} mapUrlEncoded - URL-encoded displacement map SVG (from {@link encodeSvgUrl})
 * @param {number} scale         - Base displacement scale
 * @param {number} [rRatio]      - Red channel multiplier (default 1.4)
 * @param {number} [gRatio]      - Green channel multiplier (default 1.2)
 * @returns {string} Complete filter SVG
 */
export function buildChromaticFilter(
  mapUrlEncoded,
  scale,
  rRatio = 1.4,
  gRatio = 1.2,
) {
  const r = +(scale * rRatio).toFixed(4);
  const g = +(scale * gRatio).toFixed(4);
  const b = +scale.toFixed(4);

  return [
    filterOpen(),
    feImage(mapUrlEncoded),
    // Red channel
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${r}" xChannelSelector="R" yChannelSelector="G"/>`,
    '<feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="dR"/>',
    // Green channel
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${g}" xChannelSelector="R" yChannelSelector="G"/>`,
    '<feColorMatrix type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="dG"/>',
    // Blue channel
    `<feDisplacementMap in="SourceGraphic" in2="map" scale="${b}" xChannelSelector="R" yChannelSelector="G"/>`,
    '<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="dB"/>',
    // Blend
    '<feBlend in="dR" in2="dG" mode="screen" result="rg"/>',
    '<feBlend in="rg" in2="dB" mode="screen"/>',
    filterClose(),
  ].join("");
}

// ─── Data-URI wrappers ─────────────────────────────────────────────

/**
 * Wrap a filter SVG as a CSS data URI pointing at its `#f` filter — for use in
 * `backdrop-filter`/`filter`.
 *
 * NOTE — double-encoding contract: the inner displacement map is already
 * percent-encoded by {@link encodeSvgUrl} before being embedded in the
 * `<feImage href>`. {@link encodeSvgUrl}'s `%`→`%25` pass runs first here too,
 * so those existing `%` sequences are re-escaped exactly once; the two layers
 * share {@link minifySvg}/{@link encodeSvgUrl} so they can never drift apart.
 *
 * @param {string} svg - Raw filter SVG string (must contain `<filter id="f">`)
 * @returns {string} `url("data:image/svg+xml,...#f")`
 */
export function toDataUri(svg) {
  return `url("data:image/svg+xml,${encodeSvgUrl(svg)}#f")`;
}

/**
 * Wrap a paint SVG (e.g. the grain tile) as a CSS data URI for use in
 * `background-image`. Unlike {@link toDataUri} this appends no `#f` fragment.
 *
 * @param {string} svg - Raw SVG string
 * @returns {string} `url("data:image/svg+xml,...")`
 */
export function toBackgroundUri(svg) {
  return `url("data:image/svg+xml,${encodeSvgUrl(svg)}")`;
}
