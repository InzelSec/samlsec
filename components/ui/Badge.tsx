import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

type Tone = 'neutral' | 'blueprint' | 'signed' | 'unsigned' | 'warn';

const tones: Record<Tone, string> = {
  neutral: 'border-line bg-surface-sunken text-ink-soft',
  blueprint: 'border-blueprint-soft/40 bg-[var(--blueprint-tint)] text-blueprint',
  signed: 'border-signed/30 bg-[var(--signed-tint)] text-signed',
  unsigned: 'border-unsigned/30 bg-[var(--unsigned-tint)] text-unsigned',
  warn: 'border-warn/30 bg-[var(--warn-tint)] text-warn',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  mono = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium leading-5',
        mono && 'font-mono',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A small filled dot, for legends. */
export function Dot({ tone }: { tone: Tone }) {
  const color: Record<Tone, string> = {
    neutral: 'bg-ink-soft',
    blueprint: 'bg-blueprint',
    signed: 'bg-signed',
    unsigned: 'bg-unsigned',
    warn: 'bg-warn',
  };
  return <span className={cn('inline-block h-2.5 w-2.5 shrink-0 rounded-full', color[tone])} aria-hidden />;
}
