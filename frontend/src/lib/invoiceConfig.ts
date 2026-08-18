/** Seller details for the printable invoice header. Pulled from the same
 * copy already used on the site (Footer, /our-stores) rather than invented
 * fresh, so the invoice doesn't contradict what's published elsewhere.
 *
 * GSTIN is deliberately left blank - it doesn't exist anywhere in this
 * codebase (no field, no env var, no prior mention), and an invoice is a
 * legal/tax document, so a placeholder number would be worse than none.
 * Fill this in once the real GSTIN is available; until then the invoice
 * simply omits that line rather than showing one that's wrong. */
export const INVOICE_SELLER = {
  name: 'Best Choice Clothing',
  addressLines: ['45, Spencer Plaza Mall, Floor 1', 'Anna Salai, Chennai, Tamil Nadu 600002'],
  phone: '088256 25123',
  gstin: '',
};
