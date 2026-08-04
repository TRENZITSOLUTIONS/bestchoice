import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // No trailing slash on /staff, so the dashboard root is covered too.
        disallow: ['/account/', '/checkout', '/cart', '/auth/', '/staff'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bestchoice.in'}/sitemap.xml`,
  };
}
