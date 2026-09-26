'use client';

import { useState } from 'react';
import { Button } from './Button';

export function CopyButton({
  value,
  label = 'Copy',
  size = 'sm',
  variant = 'secondary',
  disabled,
}: {
  value: string;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for older browsers / insecure contexts.
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up quietly */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Button type="button" size={size} variant={variant} onClick={copy} disabled={disabled || !value}>
      {copied ? 'Copied' : label}
    </Button>
  );
}
