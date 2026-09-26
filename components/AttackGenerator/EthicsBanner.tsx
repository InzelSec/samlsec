import Link from 'next/link';

export function EthicsBanner() {
  return (
    <div className="rounded-lg border border-[color:var(--warn)]/35 bg-[var(--warn-tint)] px-4 py-3">
      <div className="flex items-start gap-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--warn)"
          strokeWidth="1.8"
          className="mt-0.5 shrink-0"
          aria-hidden
        >
          <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
          <path d="M12 10v4" strokeLinecap="round" />
          <circle cx="12" cy="17" r="0.6" fill="var(--warn)" stroke="none" />
        </svg>
        <p className="text-sm leading-relaxed text-ink">
          These payloads only work against a Service Provider that is <strong className="font-semibold">already vulnerable</strong>.
          They operate on input you provide and never touch a remote system. Use them only against systems you own or are
          authorized to test — see{' '}
          <Link href="/responsible-use/" className="font-medium text-blueprint underline-offset-4 hover:underline">
            responsible use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
