import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shell/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Reading',
  description: 'A curated hub of the essential SAML security research — from On Breaking SAML to the latest parser-differential writeups.',
};

export default function ReadingPage() {
  return (
    <PagePlaceholder
      title="Curated research"
      lead="The writeups that actually move the field, gathered so you do not have to hunt across gists and blogs — filterable by attack class and type."
      planned={[
        'Trail of Bits, PortSwigger, GitHub Security Lab, Duo Labs, and more.',
        'Filter by attack class (XSW, parser-diff, void-c14n) and by type.',
        'Clear badges separating original guides from external sources.',
      ]}
    />
  );
}
