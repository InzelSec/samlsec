import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/tools/', '/tools/attack-generator/', '/differential/', '/cves/', '/learn/', '/checklist/', '/about/', '/responsible-use/'];
  const now = new Date();
  return routes.map((route) => ({
    url: new URL(route, site.url).toString(),
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
