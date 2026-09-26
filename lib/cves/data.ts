import raw from '@/content/cves.json';
import type { CveEntry } from './types';

/**
 * The only place `cves.json` is imported. Adding a CVE later is just
 * appending an object to that file — every filter, sort, and the recurrence
 * grouping below is derived from this array, not hardcoded.
 */
export const CVES = raw as unknown as CveEntry[];

export const CVE_BY_ID: ReadonlyMap<string, CveEntry> = new Map(CVES.map((c) => [c.id, c]));

function uniqueSorted<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort();
}

export const LANGUAGES: string[] = uniqueSorted(CVES.map((c) => c.language).filter((l): l is string => Boolean(l)));

export const ATTACK_CLASSES: string[] = uniqueSorted(CVES.map((c) => c.attackClass));

export const YEARS: number[] = Array.from(new Set(CVES.map((c) => c.year))).sort((a, b) => b - a);

export interface RecurrenceGroup {
  library: string;
  cves: CveEntry[];
  years: number[];
}

/**
 * Any library with CVEs in more than one distinct year — surfaced as a
 * recurrence group regardless of which library it is, so a future entry
 * (appended to cves.json, no code change) can join or start a new group.
 */
export const RECURRING_LIBRARIES: RecurrenceGroup[] = (() => {
  const byLibrary = new Map<string, CveEntry[]>();
  for (const c of CVES) {
    const list = byLibrary.get(c.library);
    if (list) list.push(c);
    else byLibrary.set(c.library, [c]);
  }

  const groups: RecurrenceGroup[] = [];
  for (const [library, cves] of byLibrary) {
    const years = Array.from(new Set(cves.map((c) => c.year))).sort((a, b) => a - b);
    if (years.length > 1) {
      groups.push({ library, cves: [...cves].sort((a, b) => a.year - b.year), years });
    }
  }
  return groups.sort((a, b) => b.cves.length - a.cves.length);
})();
