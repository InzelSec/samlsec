import type { Severity } from './types';

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Reuses the site's existing semantic tones — never a new color for severity. */
export const SEVERITY_TONE: Record<Severity, 'unsigned' | 'warn' | 'blueprint' | 'neutral'> = {
  critical: 'unsigned',
  high: 'warn',
  medium: 'blueprint',
  low: 'neutral',
};
