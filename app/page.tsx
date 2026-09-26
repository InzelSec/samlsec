import type { Metadata } from 'next';
import Link from 'next/link';
import { Panel } from '@/components/ui/Panel';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  description: site.description,
  alternates: { canonical: '/' },
};

const CARDS = [
  {
    href: '/decoder/',
    name: 'Decoder',
    text: 'Paste a SAMLResponse and see it decoded automatically — URL-decode, Base64-decode, and inflate, in order.',
  },
  {
    href: '/encoder/',
    name: 'Encoder',
    text: 'Turn raw XML into both SAML wire formats — HTTP-POST and HTTP-Redirect — automatically.',
  },
  {
    href: '/viewer/',
    name: 'Viewer',
    text: 'A big, byte-exact, syntax-highlighted XML viewer with a live summary of the security-relevant fields.',
  },
  {
    href: '/attacks/',
    name: 'Attacks',
    text: 'Generate XSW, signature-exclusion, comment-injection, and namespace-forgery payloads — like SAML Raider.',
  },
  {
    href: '/differential/',
    name: 'Differential',
    text: 'Watch the same document read differently by lxml, REXML, Go, and friends.',
  },
  {
    href: '/cves/',
    name: 'CVEs',
    text: 'Every SAML CVE, filterable by library, language, and attack class.',
  },
  {
    href: '/learn/',
    name: 'Learn',
    text: 'Guides to XSW, canonicalization, and the modern parser attacks — plus curated further reading.',
  },
  {
    href: '/checklist/',
    name: 'Checklist',
    text: 'A structured SSO/SAML pentest checklist you can work through.',
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="pb-10">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blueprint">
          <span className="inline-block h-px w-6 bg-blueprint-soft" aria-hidden />
          SAML security workbench
        </p>
        <h1 className="max-w-3xl text-title font-semibold text-ink sm:text-display">{site.name}</h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-soft">
          The offensive, educational counterpart to samltool.com — decode, encode, inspect, and attack SAML entirely
          in your browser. Pick a tool below.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="group block h-full">
            <Panel
              variant="outline"
              className="flex h-full flex-col gap-2 p-5 transition-colors group-hover:border-blueprint-soft group-hover:shadow-lift"
            >
              <span className="font-semibold text-ink group-hover:text-blueprint">{c.name}</span>
              <span className="text-sm leading-relaxed text-ink-soft">{c.text}</span>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}
