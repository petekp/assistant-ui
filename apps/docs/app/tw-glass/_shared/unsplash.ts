/**
 * Shared Unsplash URL helpers for the tw-glass demo pages.
 *
 * Single source of truth for the CDN URL format. These were previously
 * copy-pasted across the demo pages and had already drifted — the exported
 * helper used `q=90` while the two stress-test pages declared local copies at
 * `q=80`. Standardized here on `q=90`.
 *
 * Pure functions with no React/Node dependencies, so they're safe to import
 * from either server or client components.
 */
const BASE = "https://images.unsplash.com";

/** Full-bleed background image (1920w, q90). */
export const unsplash = (id: string) =>
  `url(${BASE}/${id}?auto=format&fit=crop&w=1920&q=90)`;

/** Small square thumbnail for the pattern picker (88×88, q60). */
export const unsplashThumb = (id: string) =>
  `url(${BASE}/${id}?auto=format&fit=crop&w=88&h=88&q=60)`;
