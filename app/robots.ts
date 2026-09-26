import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    // Plain concatenation, not `new URL('/sitemap.xml', site.url)`: per the URL
    // spec, an absolute-path reference (leading '/') replaces the ENTIRE path
    // of the base, silently dropping site.url's own '/samlsec' segment.
    sitemap: `${site.url}/sitemap.xml`,
  };
}
