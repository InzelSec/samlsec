import type { Metadata } from 'next';
import Link from 'next/link';
import { Decoder } from '@/components/SAMLDecoder/Decoder';

export const metadata: Metadata = {
  title: 'Visual SAML decoder & encoder',
  description:
    'Decode a SAMLResponse in your browser — URL-decode, Base64-decode, and inflate run automatically, in order — and see exactly what its signature covers. Encode raw XML back into both SAML bindings. Nothing is uploaded.',
  alternates: { canonical: '/' },
};

const SUITE = [
  { href: '/tools/', name: 'Encode & decode', text: 'Base64, DEFLATE, URL, pretty-print, X.509 — the plumbing, client-side.' },
  { href: '/differential/', name: 'Parser differentials', text: 'Watch the same document read differently by lxml, REXML, Go, and friends.' },
  { href: '/cves/', name: 'CVE database', text: 'Every SAML CVE, filterable by library, language, and attack class.' },
  { href: '/learn/', name: 'Learn', text: 'Guides to XSW, canonicalization, and the modern parser attacks — plus curated further reading.' },
  { href: '/checklist/', name: 'Pentest checklist', text: 'A structured SSO/SAML checklist you can work through.' },
];

export default function HomePage() {
  return (
    <div className="pb-8">
      <Decoder />

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="border-t border-line pt-10">
          <h2 className="text-heading font-semibold text-ink">The rest of the workbench</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
            The decoder is the front door. The other tools are being built out — each one client-side, each one operating
            only on input you provide.
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
            {SUITE.map((item) => (
              <li key={item.href} className="border-t border-line first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0">
                <Link href={item.href} className="group flex flex-col gap-1 py-4 transition-colors">
                  <span className="font-medium text-ink group-hover:text-blueprint">{item.name}</span>
                  <span className="text-sm leading-relaxed text-ink-soft">{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
