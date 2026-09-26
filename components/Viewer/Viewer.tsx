'use client';

import { useEffect, useMemo, useState } from 'react';
import { decodeSAML, encodingLabel } from '@/lib/saml/decode';
import { inspect, type InspectSummary } from '@/lib/saml/inspect';
import { SAMPLES, SAMPLE_XML, DEFAULT_SAMPLE_ID } from '@/content/fixtures/samples';
import { Instrument } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CodeXml } from '@/components/ui/CodeXml';
import { cn } from '@/lib/cn';

const PANEL_KEY = 'samlsec-viewer-panel';

export function Viewer() {
  const [input, setInput] = useState<string>(SAMPLE_XML[DEFAULT_SAMPLE_ID]);
  const [sampleChoice, setSampleChoice] = useState<string>(DEFAULT_SAMPLE_ID);
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

  const decoded = useMemo(() => (mounted ? decodeSAML(input) : null), [mounted, input]);
  const summary: InspectSummary | null = useMemo(() => {
    if (!decoded?.ok) return null;
    const res = inspect(decoded.xml);
    return res.ok ? res.summary : null;
  }, [decoded]);

  const loadSample = (id: string) => {
    setSampleChoice(id);
    if (id) setInput(SAMPLE_XML[id] ?? '');
  };
  const edit = (value: string) => {
    setInput(value);
    setSampleChoice('');
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">Viewer</h1>
      </header>

      <Instrument
        title="Input"
        meta={
          decoded?.ok ? (
            <Badge tone="blueprint">{encodingLabel(decoded.encoding!)}</Badge>
          ) : decoded && !decoded.ok ? (
            <Badge tone="unsigned">undecodable</Badge>
          ) : null
        }
      >
        <div className="flex flex-col gap-3 p-3 lg:flex-row">
          <label htmlFor="viewer-input" className="sr-only">
            XML or SAMLResponse to view
          </label>
          <textarea
            id="viewer-input"
            value={input}
            onChange={(e) => edit(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Paste XML or a SAMLResponse — any encoding is detected and undone automatically."
            className="h-20 w-full flex-1 resize-y rounded-md border border-line bg-surface-sunken p-3 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-ink-soft/60 focus-visible:border-blueprint-soft"
          />
          <div className="flex shrink-0 flex-row flex-wrap items-start gap-2 lg:w-48 lg:flex-col lg:items-stretch">
            <div className="relative w-full">
              <select
                aria-label="Load an example"
                value={sampleChoice}
                onChange={(e) => loadSample(e.target.value)}
                className="h-8 w-full rounded-md border border-line bg-surface pl-3 pr-8 text-sm text-ink outline-none hover:border-blueprint-soft focus-visible:border-blueprint-soft"
              >
                <option value="">Load example…</option>
                {SAMPLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" variant="ghost" onClick={() => edit('')} disabled={!input}>
              Clear
            </Button>
          </div>
        </div>
      </Instrument>

      <div className={cn('mt-4 grid grid-cols-1 gap-4', panelOpen && 'lg:grid-cols-[minmax(0,1fr)_360px]')}>
        <Instrument
          title="XML viewer"
          className="min-w-0"
          meta={
            <div className="flex items-center gap-2">
              {decoded?.ok && <CopyButton value={decoded.xml} label="Copy" />}
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
        >
          {!mounted ? (
            <div className="space-y-2 p-4" aria-hidden>
              {[80, 64, 72, 56, 68].map((w, i) => (
                <div key={i} className="h-3.5 animate-pulse rounded bg-surface-sunken" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : decoded?.ok ? (
            <div className="max-h-[62vh] overflow-auto lg:max-h-[80vh]">
              <CodeXml src={decoded.xml} className="p-4" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <p className="text-subhead font-medium text-ink">
                {input.trim() ? decoded?.error?.title ?? 'Could not read this input' : 'Paste something to view it'}
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                {input.trim() ? decoded?.error?.detail : 'Raw XML, Base64, Base64+DEFLATE, or URL-encoded — anything the Decoder accepts.'}
              </p>
            </div>
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
              {summary ? <FieldsPanel summary={summary} /> : (
                <p className="p-4 text-sm leading-relaxed text-ink-soft">
                  Decode something above to see its security-relevant fields here.
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
