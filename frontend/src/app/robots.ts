import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/account/', '/checkout/', '/cart/', '/auth/'] },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
