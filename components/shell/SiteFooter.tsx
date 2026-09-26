import Link from 'next/link';
import { site } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-chrome-line bg-chrome">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-chrome-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by{' '}
          <a href={site.githubProfile} className="font-medium text-chrome-ink underline-offset-4 hover:text-chrome-accent hover:underline">
            {site.author}
          </a>
          . Runs entirely in your browser — your SAML never leaves this machine. The offensive tools are for systems
          you own or are authorized to test — see{' '}
          <Link href="/responsible-use/" className="font-medium text-chrome-ink underline-offset-4 hover:text-chrome-accent hover:underline">
            responsible use
          </Link>
          .
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={site.github} className="hover:text-chrome-accent">
            GitHub
          </a>
          <a href={site.social} className="hover:text-chrome-accent">
            X
          </a>
          <Link href="/about/" className="hover:text-chrome-accent">
            About
          </Link>
          <a href={`${site.github}/blob/main/LICENSE`} className="hover:text-chrome-accent">
            MIT
          </a>
          <span className="text-chrome-ink-soft/70">© {year}</span>
        </nav>
      </div>
    </footer>
  );
}
