import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bestchoice.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const res = await fetch(`${API_URL}/products/?page_size=500`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const productRoutes: MetadataRoute.Sitemap = (data.results ?? []).map((p: { slug: string }) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
