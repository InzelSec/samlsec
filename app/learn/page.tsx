import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Learn',
  description:
    'Structured guides to SAML and its attacks, from fundamentals through XSW, canonicalization, and the modern parser-differential class — plus the curated external research worth reading alongside them.',
};

const GUIDES = [
  'Fundamentals: the SAML flow, XML-DSig, canonicalization, X.509.',
  'Classic attacks: the eight XSW variants, signature exclusion, XXE.',
  'Modern attacks: comment injection, parser differentials, algorithm confusion.',
  'Advanced: token theft, Golden SAML, MFA bypass.',
];

const READING = [
  'Trail of Bits, PortSwigger, GitHub Security Lab, Duo Labs, and more.',
  'Filterable by attack class (XSW, parser-diff, void-c14n) and by type.',
  'Clear badges separating original guides from external sources.',
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Badge tone="blueprint">In progress</Badge>
      <h1 className="mt-4 text-title font-semibold text-ink">Guides to the attacks</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-soft">
        A progression from the fundamentals of SAML and XML-DSig through the classic and modern attack classes —
        written to be read alongside the tools on this site — with the external research worth reading gathered
        alongside it.
      </p>

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Guides — original</h2>
        <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
          {GUIDES.map((item) => (
            <li key={item} className="py-3 text-sm leading-relaxed text-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Further reading — curated, external</h2>
        <ul className="mt-3 flex flex-col divide-y divide-line border-y border-line">
          {READING.map((item) => (
            <li key={item} className="py-3 text-sm leading-relaxed text-ink">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-sm text-ink-soft">
        In the meantime, the{' '}
        <Link href="/decoder/" className="font-medium text-blueprint underline-offset-4 hover:underline">
          visual decoder
        </Link>{' '}
        is live.
      </p>
    </div>
  );
}
