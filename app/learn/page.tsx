import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shell/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Structured guides to SAML and its attacks, from fundamentals through XSW, canonicalization, and the modern parser-differential class.',
};

export default function LearnPage() {
  return (
    <PagePlaceholder
      title="Guides to the attacks"
      lead="A progression from the fundamentals of SAML and XML-DSig through the classic and modern attack classes — written to be read alongside the tools on this site."
      planned={[
        'Fundamentals: the SAML flow, XML-DSig, canonicalization, X.509.',
        'Classic attacks: the eight XSW variants, signature exclusion, XXE.',
        'Modern attacks: comment injection, parser differentials, algorithm confusion.',
        'Advanced: token theft, Golden SAML, MFA bypass.',
      ]}
    />
  );
}
