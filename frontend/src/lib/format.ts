/**
 * Money formatting for display.
 *
 * The API returns DecimalFields as strings with two places ("249.00"), which
 * renders as "₹249.00" - noisy for whole-rupee prices, and most Indian retail
 * shows "₹249". Paise are kept only when they're actually non-zero.
 */
export function rupees(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return `₹${value}`;

  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

/**
 * In production, ImageField.url is already an absolute S3/CloudFront URL.
 * In local dev there's no CDN, so Django hands back a bare MEDIA_URL-relative
 * path - which the browser would otherwise resolve against the frontend's
 * own origin (localhost:3000) instead of the API serving it (localhost:8000).
 */
export function mediaUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, '')}`;
}
