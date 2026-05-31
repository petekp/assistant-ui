export const GLASS_FROST: string;

export function glassRefractBackdrop(defaultRefractUri: string): string;

export function buildDisplacementMapSvg(opts?: {
  inset?: number;
  cornerRadius?: number;
  innerBlur?: number;
  outerBlur?: number;
  shape?: "rect" | "circle";
}): string;

export function buildGrainSvg(opts?: {
  size?: number;
  baseFrequency?: number;
  numOctaves?: number;
  opacity?: number;
}): string;

export function minifySvg(svg: string): string;

export function encodeSvgUrl(svg: string): string;

export function buildStandardFilter(
  mapUrlEncoded: string,
  scale: number,
): string;

export function buildChromaticFilter(
  mapUrlEncoded: string,
  scale: number,
  rRatio?: number,
  gRatio?: number,
): string;

export function toDataUri(svg: string): string;

export function toBackgroundUri(svg: string): string;
