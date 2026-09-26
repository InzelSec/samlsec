'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { decodeSAML, encodingLabel } from '@/lib/saml/decode';
import { parseSAML } from '@/lib/saml/anatomy';
import { serialize } from '@/lib/saml/render';
import type { AnatomyRole, DecodeError, DecodeResult } from '@/lib/saml/types';
import { SAMPLES, SAMPLE_XML, DEFAULT_SAMPLE_ID } from '@/content/fixtures/samples';
import { Instrument } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CodeXml } from '@/components/ui/CodeXml';
import { PipelineTrail } from '@/components/ui/PipelineTrail';
import { cn } from '@/lib/cn';
import { XmlView } from './XmlView';
import { Connectors, type Segment } from './Connectors';
import { CoveragePanel } from './CoveragePanel';
import { AnatomyLegend } from './AnatomyLegend';

/** The exact chain of automatic steps `decodeSAML` applied, in the order it applied them. */
function pipelineSteps(decode: DecodeResult): string[] {
  const steps: string[] = [];
  if (decode.urlDecoded) steps.push('URL-decoded');
  if (decode.encoding === 'base64' || decode.encoding === 'base64+deflate') steps.push('Base64-decoded');
  if (decode.encoding === 'base64+deflate') steps.push('Inflated (DEFLATE)');
  return steps;
}

const GUTTER = 28;

function analyze(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { kind: 'empty' as const };

  const decode = decodeSAML(input);
  if (!decode.ok) return { kind: 'decode-error' as const, error: decode.error as DecodeError };

  const parsed = parseSAML(decode.xml);
  const anatomy = { ...parsed.anatomy, encoding: decode.encoding };
  const assertionSigned = new Map(anatomy.assertions.map((a) => [a.nodeId, a.signed]));
  const lines = parsed.root ? serialize(parsed.root, parsed.nodeIdOf, parsed.roleOf, assertionSigned) : [];
  const present = new Set<AnatomyRole>();
  for (const l of lines) if (l.openRole) present.add(l.openRole);

  return { kind: 'ok' as const, decode, parsed, anatomy, lines, present };
}

export function Decoder() {
  const [xmlViewMode, setXmlViewMode] = useState<'annotated' | 'raw'>('annotated');
  const [input, setInput] = useState<string>(SAMPLE_XML[DEFAULT_SAMPLE_ID]);
  const [sampleChoice, setSampleChoice] = useState<string>(DEFAULT_SAMPLE_ID);

  // The decode/parse pipeline uses browser-shaped APIs and produces interactive
  // output — there is nothing to gain from prerendering it. Run it only after
  // mount. Server render and first client render both show a light skeleton, so
  // there is no hydration mismatch; the pre-loaded example decodes immediately.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const result = useMemo(
    () => (mounted ? analyze(input) : ({ kind: 'loading' } as const)),
    [input, mounted],
  );

  const [hoveredRole, setHoveredRole] = useState<AnatomyRole | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);

  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [contentSize, setContentSize] = useState({ w: GUTTER, h: 0 });

  const registerNode = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) nodeRefs.current.set(id, el);
    else nodeRefs.current.delete(id);
  }, []);

  const signatures = result.kind === 'ok' ? result.anatomy.signatures : [];

  const measure = useCallback(() => {
    const content = contentRef.current;
    if (!content) return;
    const base = content.getBoundingClientRect();
    const next: Segment[] = [];
    for (const sig of signatures) {
      if (!sig.referenceNodeId || !sig.targetNodeId) continue;
      const refEl = nodeRefs.current.get(sig.referenceNodeId);
      const tgtEl = nodeRefs.current.get(sig.targetNodeId);
      if (!refEl || !tgtEl) continue;
      const r = refEl.getBoundingClientRect();
      const t = tgtEl.getBoundingClientRect();
      next.push({
        id: sig.signatureNodeId,
        y1: r.top - base.top + r.height / 2,
        y2: t.top - base.top + t.height / 2,
      });
    }
    setSegments(next);
    setContentSize({ w: GUTTER, h: content.scrollHeight });
  }, [signatures]);

  useLayoutEffect(() => {
    measure();
  }, [measure, result]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(content);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const focusNode = useCallback((nodeId: string) => {
    const el = nodeRefs.current.get(nodeId);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlightedNodeId(nodeId);
      window.setTimeout(() => setHighlightedNodeId((cur) => (cur === nodeId ? null : cur)), 1600);
    }
  }, []);

  const loadSample = (id: string) => {
    setSampleChoice(id);
    if (id) setInput(SAMPLE_XML[id] ?? '');
  };

  const editInput = (value: string) => {
    setInput(value);
    setSampleChoice(''); // once edited, it is no longer "the example"
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">Decoder</h1>
      </header>

      <div className="mb-4 rounded-md border border-line bg-[var(--warn-tint)] px-3 py-2 text-xs text-ink-soft lg:hidden">
        This instrument is built for a wide screen. It stays readable here, but the side-by-side view lands best on
        desktop.
      </div>

      <div className="flex flex-col gap-4">
        {/* Input — full width, compact: it is the least important thing on screen once decoded. */}
        <Instrument
          title="Input"
          meta={
            result.kind === 'ok' ? (
              <Badge tone="blueprint">{encodingLabel(result.decode.encoding!)}</Badge>
            ) : result.kind === 'decode-error' ? (
              <Badge tone="unsigned">undecodable</Badge>
            ) : null
          }
        >
          <div className="flex flex-col gap-3 p-3 lg:flex-row">
            <label htmlFor="saml-input" className="sr-only">
              SAMLResponse (Base64, Base64+DEFLATE, URL-encoded, or raw XML)
            </label>
            <textarea
              id="saml-input"
              value={input}
              onChange={(e) => editInput(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="Paste a SAMLResponse — Base64, Base64+DEFLATE, URL-encoded, or raw XML. Every step is detected and run automatically."
              className="h-24 w-full flex-1 resize-y rounded-md border border-line bg-surface-sunken p-3 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-ink-soft/60 focus-visible:border-blueprint-soft"
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
              <Button size="sm" variant="ghost" onClick={() => editInput('')} disabled={!input}>
                Clear
              </Button>
            </div>
          </div>
          {result.kind === 'ok' ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2.5">
              <span className="text-xs font-medium text-ink-soft">Applied automatically:</span>
              <PipelineTrail steps={pipelineSteps(result.decode)} fallback="Nothing — this was already raw XML." />
            </div>
          ) : (
            <p className="px-3 pb-3 text-xs leading-relaxed text-ink-soft">
              Decoding happens as you type. The document never leaves your machine.
            </p>
          )}
        </Instrument>

        {/* Analysis row: the XML viewer dominates; coverage rides alongside it. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Instrument
            title="XML viewer"
            className="min-w-0"
            meta={
              result.kind === 'ok' && result.parsed.root ? (
                <div className="flex items-center gap-2">
                  <span className="hidden text-ink-soft sm:inline">{`<${result.anatomy.rootName}>`}</span>
                  <div className="flex overflow-hidden rounded border border-line" role="tablist" aria-label="View mode">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={xmlViewMode === 'annotated'}
                      onClick={() => setXmlViewMode('annotated')}
                      className={cn(
                        'px-2 py-1 text-xs font-medium transition-colors',
                        xmlViewMode === 'annotated' ? 'bg-blueprint text-white' : 'bg-surface text-ink-soft hover:text-ink',
                      )}
                    >
                      Annotated
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={xmlViewMode === 'raw'}
                      onClick={() => setXmlViewMode('raw')}
                      className={cn(
                        'px-2 py-1 text-xs font-medium transition-colors',
                        xmlViewMode === 'raw' ? 'bg-blueprint text-white' : 'bg-surface text-ink-soft hover:text-ink',
                      )}
                    >
                      Raw
                    </button>
                  </div>
                  <CopyButton value={result.decode.xml} label="Copy XML" />
                </div>
              ) : null
            }
            bodyClassName="flex flex-col"
          >
            {result.kind === 'ok' && result.parsed.root && xmlViewMode === 'annotated' && (
              <div className="border-b border-line px-3 py-2">
                <AnatomyLegend present={result.present} onHover={setHoveredRole} />
              </div>
            )}

            {result.kind === 'loading' && <LoadingState />}

            {result.kind === 'empty' && <EmptyState onLoad={() => loadSample(DEFAULT_SAMPLE_ID)} />}

            {result.kind === 'decode-error' && <ErrorState error={result.error} />}

            {result.kind === 'ok' && !result.parsed.root && (
              <ErrorState error={result.parsed.parseError ?? { title: 'Could not parse', detail: 'No XML element found.' }} />
            )}

            {result.kind === 'ok' && result.parsed.root && (
              <>
                {result.parsed.parseError && (
                  <Notice tone="warn">
                    Parsed with a warning: {result.parsed.parseError.detail}
                    {result.parsed.parseError.line ? ` (near line ${result.parsed.parseError.line})` : ''}
                  </Notice>
                )}
                {!result.anatomy.isSAML && xmlViewMode === 'annotated' && (
                  <Notice tone="blueprint">
                    This is valid XML but not a SAML document, so signature coverage cannot be determined — switch to
                    Raw for a plain colored view of it.
                  </Notice>
                )}
                {xmlViewMode === 'annotated' ? (
                  <div ref={scrollRef} className="max-h-[60vh] min-h-[300px] overflow-auto lg:max-h-[74vh]">
                    <div ref={contentRef} className="relative min-w-full py-2" style={{ paddingLeft: GUTTER }}>
                      <Connectors segments={segments} width={contentSize.w} height={contentSize.h} />
                      <XmlView
                        lines={result.lines}
                        registerNode={registerNode}
                        hoveredRole={hoveredRole}
                        highlightedNodeId={highlightedNodeId}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] min-h-[300px] overflow-auto lg:max-h-[74vh]">
                    <CodeXml src={result.decode.xml} className="p-3" />
                  </div>
                )}
              </>
            )}
          </Instrument>

          {/* Coverage / insight */}
          <div className="min-w-0">
            {result.kind === 'loading' ? (
              <Instrument title="What's signed vs what's not">
                <div className="p-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-surface-sunken" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-surface-sunken" />
                  <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-surface-sunken" />
                </div>
              </Instrument>
            ) : result.kind === 'ok' && result.parsed.root && result.anatomy.isSAML ? (
              <Instrument title="What's signed vs what's not" bodyClassName="max-h-[60vh] overflow-auto lg:max-h-[74vh]">
                <CoveragePanel anatomy={result.anatomy} onFocusNode={focusNode} />
              </Instrument>
            ) : (
              <Instrument title="What's signed vs what's not">
                <p className="p-4 text-sm leading-relaxed text-ink-soft">
                  Decode a SAML document to see its signature coverage here — which assertions are protected and
                  which are left exposed.
                </p>
              </Instrument>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {[80, 64, 72, 56, 68, 48, 60].map((w, i) => (
        <div
          key={i}
          className="h-3.5 animate-pulse rounded bg-surface-sunken"
          style={{ width: `${w}%`, marginLeft: `${(i % 3) * 12}px` }}
        />
      ))}
    </div>
  );
}

function EmptyState({ onLoad }: { onLoad: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="max-w-sm">
        <p className="text-subhead font-medium text-ink">Paste a SAMLResponse to begin</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Base64, Base64+DEFLATE, URL-encoded, or raw XML — every step is detected and undone for you automatically. Or
          start from a worked example.
        </p>
      </div>
      <Button variant="primary" onClick={onLoad}>
        Load example
      </Button>
    </div>
  );
}

function ErrorState({ error }: { error: DecodeError }) {
  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-14">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-unsigned" aria-hidden />
          <h3 className="text-subhead font-semibold text-ink">{error.title}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {error.detail}
          {error.line ? ` Check around line ${error.line}.` : ''}
        </p>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'warn' | 'blueprint'; children: React.ReactNode }) {
  const cls =
    tone === 'warn'
      ? 'bg-[var(--warn-tint)] text-ink-soft'
      : 'bg-[var(--blueprint-tint)] text-ink-soft';
  return <p className={`border-b border-line px-3 py-2 text-xs leading-relaxed ${cls}`}>{children}</p>;
}
