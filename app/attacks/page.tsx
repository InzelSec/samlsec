import type { Metadata } from 'next';
import { Generator } from '@/components/AttackGenerator/Generator';

export const metadata: Metadata = {
  title: 'SAML attack generator',
  description:
    'Transform a SAMLResponse into signature-wrapping (XSW), signature-exclusion, comment-injection, and namespace-forgery payloads — with the SP condition each one needs. Client-side; operates only on input you provide.',
  alternates: { canonical: '/attacks/' },
};

export default function AttacksPage() {
  return (
    <div className="pb-8">
      <Generator />
    </div>
  );
}
