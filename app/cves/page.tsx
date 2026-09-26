import type { Metadata } from 'next';
import { CveTable } from '@/components/CveDatabase/CveTable';

export const metadata: Metadata = {
  title: 'CVE database',
  description:
    'A filterable, sortable database of SAML CVEs across libraries and languages, with root causes, patch status, and a view of how the same bug keeps coming back.',
  alternates: { canonical: '/cves/' },
};

export default function CvesPage() {
  return (
    <div className="pb-8">
      <CveTable />
    </div>
  );
}
