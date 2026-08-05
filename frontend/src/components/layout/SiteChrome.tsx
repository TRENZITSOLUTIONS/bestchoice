'use client';

import { usePathname } from 'next/navigation';

/**
 * Gates the storefront Header/Footer (ticker, nav, newsletter, shop links)
 * out of the staff dashboard. The dashboard has its own chrome in
 * staff/layout.tsx - wrapping it in the customer-facing shell too made it
 * look like a bolt-on to the shop rather than its own management tool.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/staff')) return null;
  return <>{children}</>;
}
