import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description: `Why ${site.name} exists: an offensive, educational counterpart to samltool.com for security researchers and pentesters working on SAML.`,
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-16 sm:px-6">
      <h1 className="text-title font-semibold text-ink">About {site.name}</h1>

      <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-ink-soft">
        <p>
          samltool.com is excellent at helping developers <em>integrate</em> SAML. {site.name} is its counterpart for the
          other side of the work: understanding, inspecting, and testing SAML — the security researcher&apos;s and
          pentester&apos;s view.
        </p>
        <p>
          There has never been a <code className="font-mono text-sm text-ink">jwt.io</code> for SAML: somewhere you can
          paste a SAMLResponse and immediately see its anatomy — what an assertion is, what a signature covers, and,
          crucially, what it does <em>not</em> cover. That gap is where most SAML attacks live, and seeing it is the first
          step to understanding them. The decoder is that tool; the rest of the site builds outward from it.
        </p>
        <p>
          Everything runs client-side. There is no backend and no tracking. Your SAML is processed in your browser and
          never uploaded — which also happens to be a stronger privacy guarantee than server-side debuggers can offer.
        </p>

        <h2 className="pt-2 text-heading font-semibold text-ink">Who built it</h2>
        <p>
          {site.name} is built by {site.author}, a security researcher focused on SAML and authentication. It is open
          source under the MIT license. Contributions, corrections, and new CVE entries, guides, or reading
          recommendations are welcome on the{' '}
          <a href={site.github} className="font-medium text-blueprint underline-offset-4 hover:underline">
            repository
          </a>
          .
        </p>

        <p>
          Please read the{' '}
          <Link href="/responsible-use/" className="font-medium text-blueprint underline-offset-4 hover:underline">
            responsible-use note
          </Link>{' '}
          before using the offensive tools.
        </p>
      </div>
    </article>
  );
}
