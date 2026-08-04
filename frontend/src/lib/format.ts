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
