import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shell/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Parser differentials',
  description: 'A gallery of documented cases where different XML parsers read the same SAML document differently — the heart of modern SAML research.',
};

export default function DifferentialPage() {
  return (
    <PagePlaceholder
      title="How parsers disagree"
      lead="The same bytes, read two ways. When signature verification uses one parser and identity extraction uses another, an attacker chooses who they are. This gallery shows the divergence for known CVEs, side by side."
      planned={[
        'Pre-computed cases run against lxml, REXML, Nokogiri, Go encoding/xml, and xmldom.',
        'Each case pinned to the CVE and attack class it comes from.',
        'A plain-language explanation of why the divergence matters.',
      ]}
    />
  );
}
