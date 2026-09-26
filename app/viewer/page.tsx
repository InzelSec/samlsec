import type { Metadata } from 'next';
import { Viewer } from '@/components/Viewer/Viewer';

export const metadata: Metadata = {
  title: 'XML viewer',
  description:
    'A full-screen, byte-exact, syntax-highlighted XML viewer with a live summary of the security-relevant fields — NameID, Issuer, Destination, Conditions, and more. Nothing is uploaded.',
  alternates: { canonical: '/viewer/' },
};

export default function ViewerPage() {
  return (
    <div className="pb-8">
      <Viewer />
    </div>
  );
}
