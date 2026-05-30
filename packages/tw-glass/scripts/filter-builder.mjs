/**
 * Shared SVG filter-building functions for tw-glass.
 *
 * Used by both the Node generator (scripts/generate.mjs) and the
 * browser-based tuner page. All functions are pure — no Node APIs,
 * no side effects.
 */

// ─── Backdrop-filter composition ───────────────────────────────────

/**
 * The "frost" half of the backdrop-filter: plain blur / brightness / saturation,
 * composed from tw-glass's OWN custom properties (no Tailwind `--tw-backdrop-*`
 * internals). These are universally-supported filter functions, so this is the
 * value the cross-browser `glass-frosted` utility applies on its own — and the
 * tail that `.glass` appends after the SVG displacement.
 *
 * Each term reads a continuous modifier, falling back to its @property default.
 */
export const GLASS_FROST_FILTER = [
  "blur(var(--tw-glass-blur))",
  "brightness(var(--tw-glass-brightness))",
  "saturate(var(--tw-glass-saturation))",
].join(" ");

/**
 * The `backdrop-filter` value applied to `.glass`: the SVG displacement filter
 * (`--tw-glass-filter`) followed by the frost terms. Exported so the generator
 * and the docs tuner share a single source of truth.
 *
 * The displacement `url()` renders only in Chromium; where it isn't supported
 * (Safari, Firefox) the entire value — frost included — is dropped, which is why
 * `glass-frosted` exists as the cross-browser alternative.
 */
export const GLASS_BACKDROP_FILTER = `var(--tw-glass-filter) ${GLASS_FROST_FILTER}`;

// ─── Displacement Map ──────────────────────────────────────────────

/**
 * Build the inner displacement-map SVG string.
 *
 * @param {object} opts
 * @param {number} opts.inset       - Inner rect inset from edges (viewBox units out of 100)
 * @param {number} opts.cornerRadius - Inner rect corner radius
 * @param {number} opts.innerBlur   - Gaussian blur for the inner (neutral) rect
 * @param {number} opts.outerBlur   - Gaussian blur wrapping the whole group
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
 * @param {number} rRatio        - Red channel multiplier (default 1.4)
 * @param {number} gRatio        - Green channel multiplier (default 1.2)
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

/**
 * Encode an SVG string as a minimal CSS data URI.
 *
 * Uses the same encoding approach as mini-svg-data-uri: only escape
 * characters that are unsafe in data URIs or CSS strings.
 *
 * NOTE — double-encoding contract: the inner displacement map is already
 * percent-encoded by {@link encodeSvgUrl} before being embedded in the
 * `<feImage href>`. The `%`→`%25` pass below MUST run first so those existing
 * `%` sequences are re-escaped exactly once; reordering the replacements would
 * silently corrupt the data URI. Keep this in sync with {@link encodeSvgUrl}
 * via the shared {@link minifySvg} helper.
 *
 * @param {string} svg - Raw SVG string
 * @returns {string} `url("data:image/svg+xml,...")`
 */
export function toDataUri(svg) {
  const encoded = minifySvg(svg)
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/\s+/g, "%20");
  return `url("data:image/svg+xml,${encoded}#f")`;
}
