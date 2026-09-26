import Link from 'next/link';
import { site } from '@/lib/site';

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={`${site.name} home`}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-blueprint transition-colors group-hover:border-blueprint-soft">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 6 4 12l5 6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 6l5 6-5 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink">{site.name}</span>
    </Link>
  );
}
