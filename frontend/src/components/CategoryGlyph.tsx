/**
 * Gold line-art per department, plus the colour wash that sits behind it.
 *
 * There is no product photography yet. Rather than show a broken-looking empty
 * box, a card falls back to its department's glyph over a tinted gradient - a
 * deliberate placeholder that reads as designed instead of missing. Swap this
 * out for real images once the owner supplies them.
 */

export type GlyphKey = 'mens' | 'womens' | 'kids' | 'cosmetics' | 'mobile';

const KEYWORDS: [GlyphKey, string[]][] = [
  ['womens', ['saree', 'kurti', 'dress', 'top', 'legging', 'night', 'women']],
  ['kids', ['boy', 'girl', 'baby', 'kid', 'infant']],
  ['cosmetics', ['makeup', 'skincare', 'hair', 'perfume', 'cosmetic', 'lipstick', 'serum']],
  ['mobile', ['charger', 'case', 'cover', 'earphone', 'neckband', 'watch', 'glass', 'mobile', 'accessor']],
  ['mens', ['shirt', 't-shirt', 'jean', 'trouser', 'blazer', 'ethnic', 'cargo', 'hoodie', 'short', 'men']],
];

/** Best-effort department for a category or product name. Order matters: the
 *  women's and kids' checks run before men's so "Girls Shirt" isn't menswear. */
export function glyphFor(...hints: (string | null | undefined)[]): GlyphKey {
  const haystack = hints.filter(Boolean).join(' ').toLowerCase();
  for (const [key, words] of KEYWORDS) {
    if (words.some((w) => haystack.includes(w))) return key;
  }
  return 'mens';
}

/** Wash behind the glyph, keyed to the department. */
export const GLYPH_WASH: Record<GlyphKey, string> = {
  mens: 'linear-gradient(150deg, #1c2740, #0b0f1a)',
  womens: 'linear-gradient(150deg, #4a1220, #22070d)',
  kids: 'linear-gradient(150deg, #3d3213, #171306)',
  cosmetics: 'linear-gradient(150deg, #5c1310, #260707)',
  mobile: 'linear-gradient(150deg, #23232b, #0d0d11)',
};

const PATHS: Record<GlyphKey, React.ReactNode> = {
  mens: (
    <>
      <path d="M17 7l7 5 7-5 9 5-3 8-3-1v24H14V19l-3 1-3-8Z" />
      <path d="M24 12v27" />
    </>
  ),
  womens: (
    <>
      <path d="M24 6c-3 5-7 7-11 8l-4 29h30l-4-29c-4-1-8-3-11-8Z" />
      <path d="M18 8c2 4 4 6 6 6s4-2 6-6" />
      <path d="M15 26c6 3 12 3 18 0" />
      <path d="M14 34c7 3 13 3 20 0" />
    </>
  ),
  kids: (
    <>
      <path d="M19 10l5 3 5-3 7 4-2 6-2-1v18H16V19l-2 1-2-6Z" />
      <circle cx="24" cy="26" r="3" />
    </>
  ),
  cosmetics: (
    <>
      <path d="M19 20h10v22H19z" />
      <path d="M21 20V9a3 3 0 0 1 6 0v11" />
      <path d="M19 26h10" />
    </>
  ),
  mobile: (
    <>
      <path d="M11 28v-4a13 13 0 0 1 26 0v4" />
      <rect x="7" y="27" width="7" height="12" rx="3" />
      <rect x="34" y="27" width="7" height="12" rx="3" />
    </>
  ),
};

export function CategoryGlyph({
  glyph,
  size = 72,
  stroke = 'currentColor',
  className = '',
}: {
  glyph: GlyphKey;
  size?: number;
  stroke?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={stroke}
      strokeWidth="0.9"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      {PATHS[glyph]}
    </svg>
  );
}
