import type { Metadata } from 'next';
import { Decoder } from '@/components/SAMLDecoder/Decoder';

export const metadata: Metadata = {
  title: 'Decoder',
  description:
    'Decode a SAMLResponse in your browser — URL-decode, Base64-decode, and inflate run automatically, in order — and see exactly what its signature covers. Nothing is uploaded.',
  alternates: { canonical: '/decoder/' },
};

export default function DecoderPage() {
  return (
    <div className="pb-8">
      <Decoder />
    </div>
  );
}
