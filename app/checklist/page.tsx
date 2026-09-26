import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/shell/PagePlaceholder';

export const metadata: Metadata = {
  title: 'Pentest checklist',
  description: 'An interactive SSO/SAML testing checklist grouped by phase, with progress saved locally and exportable to Markdown.',
};

export default function ChecklistPage() {
  return (
    <PagePlaceholder
      title="SSO / SAML pentest checklist"
      lead="A structured checklist for testing a SAML Service Provider — signature handling, XSW, parser differentials, encryption, replay — that you can work through and export."
      planned={[
        'Items grouped by testing phase, each with a short how-to.',
        'Progress saved in your browser (localStorage), never uploaded.',
        'Export your progress to Markdown for the report.',
      ]}
    />
  );
}
