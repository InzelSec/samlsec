import Link from 'next/link';
import { site } from '@/lib/site';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by{' '}
          <a href={site.githubProfile} className="font-medium text-ink underline-offset-4 hover:text-blueprint hover:underline">
            {site.author}
          </a>
          . Runs entirely in your browser — your SAML never leaves this machine.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={site.github} className="hover:text-blueprint">
            GitHub
          </a>
          <a href={site.social} className="hover:text-blueprint">
            X
          </a>
          <Link href="/about/" className="hover:text-blueprint">
            About
          </Link>
          <Link href="/responsible-use/" className="hover:text-blueprint">
            Responsible use
          </Link>
          <a href={`${site.github}/blob/main/LICENSE`} className="hover:text-blueprint">
            MIT
          </a>
          <span className="text-ink-soft/70">© {year}</span>
        </nav>
      </div>
    </footer>
  );
}
