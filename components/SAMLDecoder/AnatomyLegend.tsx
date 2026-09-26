'use client';

import type { AnatomyRole } from '@/lib/saml/types';
import { cn } from '@/lib/cn';

const ROLES: { role: AnatomyRole; label: string }[] = [
  { role: 'assertion', label: 'Assertion' },
  { role: 'signature', label: 'Signature' },
  { role: 'reference', label: 'Reference' },
  { role: 'digest', label: 'DigestValue' },
  { role: 'signature-value', label: 'SignatureValue' },
  { role: 'nameid', label: 'NameID' },
  { role: 'conditions', label: 'Conditions' },
  { role: 'attribute', label: 'Attribute' },
];

export function AnatomyLegend({
  onHover,
  present,
}: {
  onHover: (role: AnatomyRole | null) => void;
  present: Set<AnatomyRole>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" onMouseLeave={() => onHover(null)}>
      {ROLES.map(({ role, label }) => {
        const has = present.has(role);
        return (
          <button
            key={role}
            type="button"
            disabled={!has}
            onMouseEnter={() => has && onHover(role)}
            onFocus={() => has && onHover(role)}
            onBlur={() => onHover(null)}
            className={cn(
              'rounded border px-2 py-0.5 text-xs transition-colors',
              has
                ? 'border-line bg-surface text-ink-soft hover:border-blueprint-soft hover:text-blueprint'
                : 'cursor-default border-transparent text-ink-soft/40 line-through',
            )}
            title={has ? `Highlight ${label} elements` : `No ${label} in this document`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
