'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { decodeSAML } from '@/lib/saml/decode';
import { inspect, type InspectSummary } from '@/lib/saml/inspect';
import { highlightXml, HL_CLASS } from '@/lib/saml/highlight';
import { Instrument } from '@/components/ui/Panel';
import { CopyButton } from '@/components/ui/CopyButton';
import { cn } from '@/lib/cn';

const PANEL_KEY = 'samlsec-viewer-panel';

/**
 * Shared box metrics between the highlighted `<pre>` and the transparent
 * `<textarea>` stacked on top of it in `EditableXml` — they must match
 * exactly (font, size, line-height, padding, wrapping) or the invisible
 * caret/text in the textarea drifts out of alignment with the colored glyphs
 * rendered underneath it.
 */
const SURFACE = 'whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-relaxed';

function EditableXml({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const tokens = useMemo(() => highlightXml(value), [value]);

  const syncScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative h-[62vh] lg:h-[80vh]">
      <pre ref={preRef} aria-hidden className={cn(SURFACE, 'pointer-events-none absolute inset-0 m-0 overflow-auto')}>
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={HL_CLASS[t.k]}>
              {t.t}
            </span>
          ))}
        </code>
      </pre>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={placeholder}
        aria-label="XML content — paste or edit directly"
        className={cn(
          SURFACE,
          'absolute inset-0 resize-none overflow-auto bg-transparent text-transparent caret-ink outline-none placeholder:text-ink-soft/60',
        )}
      />
    </div>
  );
}

export function Viewer() {
  const [raw, setRaw] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(PANEL_KEY);
      if (stored != null) setPanelOpen(stored !== 'closed');
    } catch {
      /* storage may be unavailable; default (open) stands */
    }
  }, []);

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(PANEL_KEY, next ? 'open' : 'closed');
      } catch {
        /* per-session only, then */
      }
      return next;
    });
  };

  // The single surface both accepts paste and shows the result: if what
  // lands decodes to something OTHER than itself (Base64, +DEFLATE,
  // URL-encoded), replace it with the decoded XML so the box always holds
  // readable, editable markup. Already-raw XML decodes to itself — a no-op —
  // so ordinary hand-editing is never touched or re-derived mid-keystroke.
  const handleChange = (value: string) => {
    const decoded = decodeSAML(value);
    setRaw(decoded.ok && decoded.xml !== value.trim() ? decoded.xml : value);
  };

  const summary: InspectSummary | null = useMemo(() => {
    if (!raw.trim()) return null;
    const res = inspect(raw);
    return res.ok ? res.summary : null;
  }, [raw]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">Viewer</h1>
      </header>

      <div className={cn('grid grid-cols-1 gap-4', panelOpen && 'lg:grid-cols-[minmax(0,1fr)_360px]')}>
        <Instrument
          title="XML viewer"
          className="min-w-0"
          meta={
            <div className="flex items-center gap-2">
              <CopyButton value={raw} label="Copy" disabled={!raw} />
              <button
                type="button"
                onClick={togglePanel}
                className="inline-flex h-7 items-center gap-1 rounded border border-line bg-surface px-2 text-xs font-medium text-ink-soft transition-colors hover:border-blueprint-soft hover:text-blueprint"
                aria-pressed={panelOpen}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  {panelOpen ? (
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
                {panelOpen ? 'Hide fields' : 'Show fields'}
              </button>
            </div>
          }
          bodyClassName="flex flex-col"
        >
          {!mounted ? (
            <div className="space-y-2 p-4" aria-hidden>
              {[80, 64, 72, 56, 68].map((w, i) => (
                <div key={i} className="h-3.5 animate-pulse rounded bg-surface-sunken" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <EditableXml
              value={raw}
              onChange={handleChange}
              placeholder="Paste or write XML here — a SAMLResponse in any encoding is decoded in place automatically."
            />
          )}
        </Instrument>

        {panelOpen && (
          <div className="min-w-0">
            <Instrument
              title="Security fields"
              meta={
                <button
                  type="button"
                  onClick={togglePanel}
                  aria-label="Close panel"
                  className="inline-flex h-6 w-6 items-center justify-center rounded text-ink-soft hover:bg-surface-sunken hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              }
              bodyClassName="max-h-[62vh] overflow-auto lg:max-h-[80vh]"
            >
              {summary ? (
                <FieldsPanel summary={summary} />
              ) : (
                <p className="p-4 text-sm leading-relaxed text-ink-soft">
                  Paste something in the viewer to see its security-relevant fields here.
                </p>
              )}
            </Instrument>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line px-4 py-3 last:border-b-0">
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-ink-soft/70">None found</p>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="break-all font-mono text-[12px] leading-relaxed text-ink">{children}</span>;
}

function FieldsPanel({ summary }: { summary: InspectSummary }) {
  return (
    <div className="flex flex-col">
      <Field label="NameID">
        {summary.nameIds.length ? (
          <ul className="flex flex-col gap-1.5">
            {summary.nameIds.map((n, i) => (
              <li key={i} className="flex flex-wrap items-center gap-1.5">
                <Mono>{n.value || '(empty)'}</Mono>
                {n.format && (
                  <span className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-soft">
                    {n.format.replace(/^urn:oasis:names:tc:SAML:[\d.]+:nameid-format:/, '')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Issuer">
        {summary.issuers.length ? (
          <ul className="flex flex-col gap-1">
            {summary.issuers.map((iss, i) => (
              <li key={i}>
                <Mono>{iss}</Mono>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Destination">{summary.destination ? <Mono>{summary.destination}</Mono> : <Empty />}</Field>

      <Field label="Conditions">
        {summary.conditions ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
            <dt className="text-ink-soft">NotBefore</dt>
            <dd>{summary.conditions.notBefore ? <Mono>{summary.conditions.notBefore}</Mono> : <Empty />}</dd>
            <dt className="text-ink-soft">NotOnOrAfter</dt>
            <dd>{summary.conditions.notOnOrAfter ? <Mono>{summary.conditions.notOnOrAfter}</Mono> : <Empty />}</dd>
          </dl>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Audience restriction">
        {summary.audiences.length ? (
          <ul className="flex flex-col gap-1">
            {summary.audiences.map((a, i) => (
              <li key={i}>
                <Mono>{a}</Mono>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Attribute statement">
        {summary.attributes.length ? (
          <ul className="flex flex-col gap-2.5">
            {summary.attributes.map((a, i) => (
              <li key={i}>
                <div className="text-xs font-medium text-ink">
                  {a.name}
                  {a.friendlyName && <span className="font-normal text-ink-soft"> ({a.friendlyName})</span>}
                </div>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {a.values.length ? (
                    a.values.map((v, j) => (
                      <span key={j}>
                        <Mono>{v}</Mono>
                      </span>
                    ))
                  ) : (
                    <Empty />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Signature method">
        {summary.signatureMethods.length ? (
          <ul className="flex flex-col gap-1">
            {summary.signatureMethods.map((m, i) => (
              <li key={i}>
                <Mono>{m}</Mono>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>

      <Field label="Digest value">
        {summary.digestValues.length ? (
          <ul className="flex flex-col gap-1">
            {summary.digestValues.map((d, i) => (
              <li key={i}>
                <Mono>{d}</Mono>
              </li>
            ))}
          </ul>
        ) : (
          <Empty />
        )}
      </Field>
    </div>
  );
}
