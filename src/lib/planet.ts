/**
 * Deterministic planet styling. Given any stable seed (a course/lesson id or
 * an index), we always produce the SAME planet look — so a lesson is "the same
 * planet" on every visit. Purely cosmetic; no effect on data.
 */

export interface PlanetPalette {
  name: string;
  /** highlight (lit side) */
  light: string;
  /** main body color */
  base: string;
  /** shadow (dark side) */
  shadow: string;
  /** glow + ring accent */
  accent: string;
}

// A small, harmonious set that sits well on the deep-navy space background.
const PALETTES: PlanetPalette[] = [
  { name: "cyan", light: "#7DE7FF", base: "#22D3EE", shadow: "#0E5B72", accent: "#22D3EE" },
  { name: "blue", light: "#93B8FF", base: "#3B82F6", shadow: "#1E3A8A", accent: "#3B82F6" },
  { name: "gold", light: "#FFE39A", base: "#F5C24C", shadow: "#8A6416", accent: "#F5C24C" },
  { name: "violet", light: "#C7B3FF", base: "#8B5CF6", shadow: "#4C1D95", accent: "#A78BFA" },
  { name: "rose", light: "#FFB3C7", base: "#F472B6", shadow: "#831843", accent: "#F472B6" },
  { name: "teal", light: "#8FF7D6", base: "#2DD4A7", shadow: "#0F5F49", accent: "#2DD4A7" },
];

/** Stable string hash (djb2-ish) → non-negative integer. */
function hash(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(h);
}

export function planetPalette(seed: string): PlanetPalette {
  return PALETTES[hash(seed) % PALETTES.length];
}

/** Whether this planet should show a Saturn-style ring (about 1/3 of them). */
export function planetHasRing(seed: string): boolean {
  return hash(seed + "ring") % 3 === 0;
}

/** A small deterministic rotation (deg) so planets don't all look identical. */
export function planetTilt(seed: string): number {
  return (hash(seed + "tilt") % 40) - 20; // -20..+19
}
