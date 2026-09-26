import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/', '/tools/', '/tools/attack-generator/', '/differential/', '/cves/', '/learn/', '/checklist/', '/about/', '/responsible-use/'];
  const now = new Date();
  return routes.map((route) => ({
    // Plain concatenation, not `new URL(route, site.url)`: an absolute-path
    // reference replaces the base's entire path per the URL spec, which would
    // silently drop site.url's '/samlsec' segment on every route.
    url: `${site.url}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
