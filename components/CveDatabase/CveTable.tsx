'use client';

import { useEffect, useMemo, useState } from 'react';
import { CVES, CVE_BY_ID, LANGUAGES, ATTACK_CLASSES, YEARS, RECURRING_LIBRARIES } from '@/lib/cves/data';
import { SEVERITY_ORDER, SEVERITY_LABEL, SEVERITY_TONE } from '@/lib/cves/format';
import type { CveEntry, Severity } from '@/lib/cves/types';
import { Instrument } from '@/components/ui/Panel';
import { Badge, Dot } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

const ALL = 'all';
type SortKey = 'year' | 'cvss';
type SortDir = 'asc' | 'desc';

function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) {
    return (
      <Badge tone="neutral" mono>
        —
      </Badge>
    );
  }
  return (
    <Badge tone={SEVERITY_TONE[severity]} mono>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

function RecurrenceTimeline({ onSelect }: { onSelect: (id: string) => void }) {
  if (RECURRING_LIBRARIES.length === 0) return null;

  return (
    <Instrument title="Recurring root causes" className="mb-4">
      <div className="flex flex-col divide-y divide-line">
        {RECURRING_LIBRARIES.map((group) => {
          const span = group.years[group.years.length - 1] - group.years[0];
          return (
            <div key={group.library} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="font-mono text-sm font-semibold text-ink">{group.library}</h3>
                <p className="text-xs text-ink-soft">
                  {group.cves.length} CVEs across {span} year{span === 1 ? '' : 's'} ({group.years[0]}–
                  {group.years[group.years.length - 1]})
                </p>
              </div>

              <div className="mt-4 flex items-center">
                {group.cves.map((c, i) => (
                  <div key={c.id} className="flex flex-1 items-center last:flex-none">
                    {i > 0 && <div className="h-px flex-1 bg-line" aria-hidden />}
                    <button
                      type="button"
                      onClick={() => onSelect(c.id)}
                      className="group flex shrink-0 flex-col items-center gap-1.5 px-2"
                    >
                      <span className="text-[11px] text-ink-soft">{c.year}</span>
                      <Dot tone={c.severity ? SEVERITY_TONE[c.severity] : 'neutral'} />
                      <Badge tone="neutral" mono className="transition-colors group-hover:border-blueprint-soft group-hover:text-blueprint">
                        {c.id}
                      </Badge>
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Same library, {group.cves.length} separate waves — the strongest evidence here that an incremental
                patch didn&rsquo;t fix the underlying class of bug.
              </p>
            </div>
          );
        })}
      </div>
    </Instrument>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors',
        active ? 'text-blueprint' : 'text-ink-soft hover:text-ink',
      )}
    >
      {label}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden
        className={cn('transition-transform', active && dir === 'asc' && 'rotate-180', !active && 'opacity-30')}
      >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function RelatedBadges({ ids, onSelect }: { ids: string[]; onSelect: (id: string) => void }) {
  if (ids.length === 0) return <span className="text-xs text-ink-soft/70">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {ids.map((id) =>
        CVE_BY_ID.has(id) ? (
          <button key={id} type="button" onClick={() => onSelect(id)}>
            <Badge tone="neutral" mono className="transition-colors hover:border-blueprint-soft hover:text-blueprint">
              {id}
            </Badge>
          </button>
        ) : (
          <Badge key={id} tone="neutral" mono className="opacity-60">
            {id}
          </Badge>
        ),
      )}
    </div>
  );
}

function ExpandIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={cn('shrink-0 transition-transform', open && 'rotate-90')}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CveTable() {
  const [language, setLanguage] = useState(ALL);
  const [attackClass, setAttackClass] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [severity, setSeverity] = useState(ALL);
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return CVES.filter((c) => {
      if (language !== ALL && c.language !== language) return false;
      if (attackClass !== ALL && c.attackClass !== attackClass) return false;
      if (year !== ALL && String(c.year) !== year) return false;
      if (severity !== ALL && c.severity !== severity) return false;
      return true;
    });
  }, [language, attackClass, year, severity]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const cmp = sortKey === 'year' ? a.year - b.year : (a.cvss ?? -1) - (b.cvss ?? -1);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  useEffect(() => {
    if (!pendingId) return;
    const el = document.getElementById(`cve-${pendingId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setExpanded((prev) => new Set(prev).add(pendingId));
    setHighlightId(pendingId);
    setPendingId(null);
    const t = setTimeout(() => setHighlightId(null), 1800);
    return () => clearTimeout(t);
  }, [pendingId, sorted]);

  const goTo = (id: string) => {
    setLanguage(ALL);
    setAttackClass(ALL);
    setYear(ALL);
    setSeverity(ALL);
    setPendingId(id);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const selectCls =
    'h-8 rounded-md border border-line bg-surface px-2.5 text-xs text-ink outline-none hover:border-blueprint-soft focus-visible:border-blueprint-soft';

  const filtersActive = language !== ALL || attackClass !== ALL || year !== ALL || severity !== ALL;
  const clearFilters = () => {
    setLanguage(ALL);
    setAttackClass(ALL);
    setYear(ALL);
    setSeverity(ALL);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">CVE database</h1>
      </header>

      <RecurrenceTimeline onSelect={goTo} />

      <Instrument
        title="All CVEs"
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <select aria-label="Filter by language" value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
              <option value={ALL}>Language: all</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by attack class"
              value={attackClass}
              onChange={(e) => setAttackClass(e.target.value)}
              className={selectCls}
            >
              <option value={ALL}>Class: all</option>
              {ATTACK_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select aria-label="Filter by year" value={year} onChange={(e) => setYear(e.target.value)} className={selectCls}>
              <option value={ALL}>Year: all</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className={selectCls}
            >
              <option value={ALL}>Severity: all</option>
              {SEVERITY_ORDER.map((s) => (
                <option key={s} value={s}>
                  {SEVERITY_LABEL[s]}
                </option>
              ))}
            </select>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="px-1.5 text-xs text-ink-soft underline-offset-2 hover:text-blueprint hover:underline">
                Clear
              </button>
            )}
          </div>
        }
        bodyClassName="overflow-x-auto"
      >
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-sunken/60 text-left">
              <th className="w-8 px-2 py-2" />
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">CVE</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Library</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Language</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Attack class</th>
              <th className="px-3 py-2">
                <SortHeader label="Year" active={sortKey === 'year'} dir={sortDir} onClick={() => toggleSort('year')} />
              </th>
              <th className="px-3 py-2">
                <SortHeader label="CVSS" active={sortKey === 'cvss'} dir={sortDir} onClick={() => toggleSort('cvss')} />
              </th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Severity</th>
              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Patch</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const isOpen = expanded.has(c.id);
              const hasDetail = Boolean(c.rootCause || c.notable || c.relatedTo.length);
              return (
                <RowGroup
                  key={c.id}
                  cve={c}
                  open={isOpen}
                  highlighted={highlightId === c.id}
                  hasDetail={hasDetail}
                  onToggle={() => hasDetail && toggleExpand(c.id)}
                  onSelectRelated={goTo}
                />
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center text-sm text-ink-soft">
                  No CVEs match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Instrument>
    </div>
  );
}

function RowGroup({
  cve,
  open,
  highlighted,
  hasDetail,
  onToggle,
  onSelectRelated,
}: {
  cve: CveEntry;
  open: boolean;
  highlighted: boolean;
  hasDetail: boolean;
  onToggle: () => void;
  onSelectRelated: (id: string) => void;
}) {
  return (
    <>
      <tr
        id={`cve-${cve.id}`}
        className={cn('border-b border-line align-top transition-colors duration-700', highlighted && 'bg-[var(--blueprint-tint)]')}
      >
        <td className="px-2 py-2.5">
          {hasDetail && (
            <button
              type="button"
              onClick={onToggle}
              aria-label={open ? 'Collapse details' : 'Expand details'}
              aria-expanded={open}
              className="flex h-6 w-6 items-center justify-center rounded text-ink-soft hover:bg-surface-sunken hover:text-ink"
            >
              <ExpandIcon open={open} />
            </button>
          )}
        </td>
        <td className="px-3 py-2.5">
          <a
            href={cve.advisoryURL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-medium text-blueprint underline-offset-4 hover:underline"
          >
            {cve.id}
          </a>
        </td>
        <td className="px-3 py-2.5 text-ink">{cve.library}</td>
        <td className="px-3 py-2.5 text-ink-soft">{cve.language ?? '—'}</td>
        <td className="px-3 py-2.5 text-ink-soft">{cve.attackClass}</td>
        <td className="px-3 py-2.5 tabular-nums text-ink">{cve.year}</td>
        <td className="px-3 py-2.5 tabular-nums text-ink">{cve.cvss ?? '—'}</td>
        <td className="px-3 py-2.5">
          <SeverityBadge severity={cve.severity} />
        </td>
        <td className="px-3 py-2.5 text-ink-soft">
          {cve.patchStatus}
          {cve.patchedVersion ? <span className="text-ink"> · {cve.patchedVersion}</span> : null}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-line bg-surface-sunken/40">
          <td />
          <td colSpan={8} className="px-3 py-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-2">
                {cve.rootCause && (
                  <div>
                    <p className="text-xs font-medium text-ink-soft">Root cause</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink">{cve.rootCause}</p>
                  </div>
                )}
                {cve.notable && (
                  <div>
                    <p className="text-xs font-medium text-ink-soft">Notable</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink">{cve.notable}</p>
                  </div>
                )}
              </div>
              <div className="sm:w-48">
                <p className="text-xs font-medium text-ink-soft">Related</p>
                <div className="mt-1">
                  <RelatedBadges ids={cve.relatedTo} onSelect={onSelectRelated} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
