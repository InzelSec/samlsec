import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type PanelVariant = 'outline' | 'raised' | 'sunken';

const variants: Record<PanelVariant, string> = {
  outline: 'border border-line bg-surface',
  raised: 'border border-line bg-surface shadow-panel',
  sunken: 'border border-line bg-surface-sunken',
};

export function Panel({
  children,
  variant = 'outline',
  className,
}: {
  children: ReactNode;
  variant?: PanelVariant;
  className?: string;
}) {
  return <div className={cn('rounded-lg', variants[variant], className)}>{children}</div>;
}

/**
 * An "instrument" — the framed, labelled surface the tools live in. Its header
 * carries the blueprint accent so the tool reads as a piece of equipment, not a
 * generic card. Deliberately distinct from Panel so hierarchy is visible.
 */
export function Instrument({
  title,
  meta,
  children,
  className,
  bodyClassName,
}: {
  title: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}>
      <header className="flex items-center justify-between gap-4 border-b border-line bg-[var(--blueprint-tint)] px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-tight text-blueprint">{title}</h2>
        {meta ? <div className="flex items-center gap-2 text-xs text-ink-soft">{meta}</div> : null}
      </header>
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}
