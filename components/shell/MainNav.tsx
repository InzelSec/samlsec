'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV } from '@/lib/site';
import { cn } from '@/lib/cn';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function MainNav() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={item.hint}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-[var(--blueprint-tint)] font-medium text-blueprint'
                  : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile toggle */}
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-ink-soft md:hidden"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label="Toggle navigation"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
        </svg>
      </button>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="absolute inset-x-0 top-full z-40 border-b border-line bg-surface p-2 shadow-lift md:hidden"
        >
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex flex-col rounded-md px-3 py-2',
                  active ? 'bg-[var(--blueprint-tint)] text-blueprint' : 'text-ink hover:bg-surface-sunken',
                )}
              >
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-ink-soft">{item.hint}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
