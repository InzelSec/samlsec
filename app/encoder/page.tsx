import type { Metadata } from 'next';
import { EncodePanel } from '@/components/SAMLDecoder/EncodePanel';

export const metadata: Metadata = {
  title: 'Encoder',
  description:
    'Turn raw SAML XML into both wire formats automatically — Base64 for HTTP-POST, and Deflate + Base64 + URL-encode for HTTP-Redirect. Encoded byte-for-byte, never reformatted. Nothing leaves your browser.',
  alternates: { canonical: '/encoder/' },
};

export default function EncoderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">Encoder</h1>
      </header>
      <EncodePanel />
    </div>
  );
}
