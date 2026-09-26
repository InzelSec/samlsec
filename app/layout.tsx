import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { SiteFooter } from '@/components/shell/SiteFooter';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — inspect and break SAML`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author }],
  keywords: [
    'SAML',
    'SAML security',
    'XML signature wrapping',
    'XSW',
    'parser differential',
    'single sign-on',
    'SSO security',
    'pentest',
    'SAMLResponse decoder',
  ],
  openGraph: {
    type: 'website',
    siteName: site.name,
    url: site.url,
    title: `${site.name} — inspect and break SAML`,
    description: site.description,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: `${site.name}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — inspect and break SAML`,
    description: site.description,
    images: ['/og.svg'],
  },
  robots: { index: true, follow: true },
};

const themeInit = `(function(){try{var k='samlsec-theme';var s=localStorage.getItem(k);var m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s||(m?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

// GitHub Pages serves static files with no custom HTTP headers, so this is
// delivered as a <meta http-equiv> tag instead of a real CSP header — the one
// mechanism a static host allows. That also means a few directives Chrome/
// Firefox silently ignore outside a real header (frame-ancestors, report-uri,
// sandbox) are left out entirely rather than included as dead weight.
//
// script-src needs 'unsafe-inline': the App Router's static export ships its
// hydration payload as several inline `self.__next_f.push(...)` scripts whose
// content is per-page and rebuilt on every `next build` — there's no server
// to hand out a per-request nonce, and hashing them would mean regenerating
// per-page hashes on every build (verified by testing: hash-only script-src
// silently breaks hydration — the app renders a blank page). Every other
// origin stays locked to 'self' or 'none', so an inline-script injection
// still can't load external code/images/fonts, exfiltrate via fetch/form, or
// frame the site — the site also makes zero network requests of its own
// (SAML input never leaves the browser), so connect-src stays 'self'.
const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  // React also emits computed inline `style` attributes (e.g. indent depth) —
  // set via the DOM style property, not string/HTML injection, but CSP still
  // requires 'unsafe-inline' here for the attribute form to be allowed.
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self'`,
  `font-src 'self'`,
  `connect-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-src 'none'`,
  `worker-src 'none'`,
].join('; ');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-ink focus:shadow-lift"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
