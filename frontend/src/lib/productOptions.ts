/** Shared helpers for rendering a product's variant option pickers (colour
 * swatches, size ordering) - used wherever a product's colours/sizes get
 * shown to a shopper. */

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];

/** S, M, L, XL, XXL in the order people actually expect, not whatever order
 * the variants happen to come back from the database in. Numeric sizes
 * (waist sizes like 30/32/34) sort numerically after the named ones;
 * anything unrecognised falls back to alphabetical rather than erroring. */
export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.toUpperCase());
    const bi = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    const an = Number(a);
    const bn = Number(b);
    if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
    return a.localeCompare(b);
  });
}

/** Common colour/shade names -> a real swatch value. Colour is free-typed
 * text ("Rustic Red", "Sky Blue"), so this can't be exhaustive - anything not
 * listed falls back to trying the raw name as a CSS colour keyword (works
 * for plain ones like "teal" or "indigo" for free), and if that's not a
 * valid colour either, the browser just ignores it - the text label next to
 * the swatch means nothing is ever lost, only the visual match is missing. */
const NAMED_SWATCHES: Record<string, string> = {
  black: '#0a0a0a', white: '#ffffff', blue: '#2563eb', red: '#dc2626',
  green: '#16a34a', yellow: '#eab308', orange: '#ea580c', purple: '#9333ea',
  pink: '#ec4899', grey: '#6b7280', gray: '#6b7280', brown: '#78350f',
  navy: '#1e3a5f', beige: '#d4c5a9', maroon: '#7f1d1d', olive: '#65714a',
  gold: '#ca8a04', silver: '#9ca3af', cream: '#f5f0e1', multicolor: 'linear-gradient(135deg,#dc2626,#eab308,#2563eb)',
  'rustic red': '#8b3a3a', 'nude beige': '#d9bfa3', 'sky blue': '#7dd3fc',
  'berry wine': '#5c1a2e', ivory: '#fffff0',
};

export function swatchFor(name: string): string {
  const key = name.trim().toLowerCase();
  return NAMED_SWATCHES[key] ?? key;
}
