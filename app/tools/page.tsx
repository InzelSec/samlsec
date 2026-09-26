import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Client-side SAML tooling: the attack generator (live), plus Base64/DEFLATE/URL encoding, XML pretty-printing, X.509 formatting, and a general XML viewer.',
};

const LIVE = [
  {
    href: '/tools/attack-generator/',
    name: 'Attack generator',
    text: 'Turn a SAMLResponse into XSW, signature-exclusion, comment-injection, and namespace-forgery payloads — each with the SP condition it needs.',
  },
];

const PLANNED = [
  'Base64 and Base64 + DEFLATE encode / decode (the two SAML bindings).',
  'URL encode / decode and XML pretty-printing.',
  'X.509 certificate formatter and fingerprint calculator.',
  'A full-screen general XML viewer with a structural summary.',
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-title font-semibold text-ink">Tools</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">
        The offensive and everyday SAML plumbing — the conversions samltool.com offers, run entirely in your browser,
        plus the attack tooling that site never had.
      </p>

      <div className="mt-8">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Available now</h2>
        </div>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {LIVE.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group flex items-start gap-3 py-4">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink group-hover:text-blueprint">{item.name}</span>
                    <Badge tone="signed">live</Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{item.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">In progress</h2>
          <Badge tone="blueprint">soon</Badge>
        </div>
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {PLANNED.map((item) => (
            <li key={item} className="py-3 text-sm leading-relaxed text-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
