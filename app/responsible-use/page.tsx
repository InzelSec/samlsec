import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Responsible use',
  description: `${site.name} is for education and authorized security testing. It operates only on input you provide and never scans, targets, or attacks remote systems.`,
};

export default function ResponsibleUsePage() {
  return (
    <article className="mx-auto max-w-prose px-4 py-16 sm:px-6">
      <h1 className="text-title font-semibold text-ink">Responsible use</h1>

      <div className="mt-6 flex flex-col gap-5 text-base leading-relaxed text-ink-soft">
        <p>
          {site.name} exists for two purposes: learning how SAML works and where it breaks, and testing systems you are
          authorized to test. Both are legitimate, well-established uses — the same ground occupied by tools like SAML
          Raider and Burp Suite.
        </p>

        <h2 className="pt-2 text-heading font-semibold text-ink">How these tools are built</h2>
        <p>
          Every tool here operates only on input <em>you</em> paste in. Nothing on this site scans a target, takes a URL
          to attack, or reaches out to a remote system. The work happens entirely in your browser — your SAML never
          leaves your machine. There is no server to receive it.
        </p>
        <p>
          The tools do not forge anyone else&apos;s signature. Modern SAML attacks do not need that: they exploit how a
          Service Provider processes a document. Where a payload needs a valid signature, you sign it with a key from
          your own test environment.
        </p>

        <h2 className="pt-2 text-heading font-semibold text-ink">Your responsibility</h2>
        <p>
          Only test systems you own or have explicit, written authorization to test. Unauthorized access to computer
          systems is illegal in most jurisdictions, regardless of intent. Generating a payload here does not authorize
          you to send it anywhere.
        </p>

        <h2 className="pt-2 text-heading font-semibold text-ink">Found a real bug?</h2>
        <p>
          Report it responsibly. Contact the vendor or maintainer privately, give them reasonable time to fix it, and
          follow any coordinated-disclosure process they publish. If you find a problem with {site.name} itself, open an
          issue on the{' '}
          <a href={site.github} className="font-medium text-blueprint underline-offset-4 hover:underline">
            project repository
          </a>
          .
        </p>
      </div>

      <p className="mt-10 text-sm text-ink-soft">
        Back to the{' '}
        <Link href="/decoder/" className="font-medium text-blueprint underline-offset-4 hover:underline">
          decoder
        </Link>
        .
      </p>
    </article>
  );
}
