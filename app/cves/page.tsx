import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shell/PagePlaceholder';

export const metadata: Metadata = {
  title: 'CVE database',
  description: 'A filterable database of SAML CVEs across libraries and languages, with root causes and a view of how the same bug keeps coming back.',
};

export default function CvesPage() {
  return (
    <PagePlaceholder
      title="The SAML CVE database"
      lead="Every SAML CVE worth knowing, in one filterable table — by library, language, attack class, year, and severity. Plus the recurrence view: how the same root cause returns after an incomplete fix."
      planned={[
        'Sortable, filterable table sourced from a structured dataset.',
        'Root-cause summary and patch status for each entry.',
        'Recurrence grouping — see a library re-fixing the same class of bug.',
      ]}
    />
  );
}
