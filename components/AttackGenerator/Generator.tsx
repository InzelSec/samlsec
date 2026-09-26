'use client';

import { useEffect, useMemo, useState } from 'react';
import { ATTACKS, getAttack } from '@/lib/saml/attacks/modules';
import { CATEGORY_LABEL, type AttackCategory, type AttackParams } from '@/lib/saml/attacks/types';
import { encodeBase64, encodeBase64Deflate, encodeRedirectParam } from '@/lib/saml/encode';
import { SAMPLES, SAMPLE_XML, DEFAULT_SAMPLE_ID } from '@/content/fixtures/samples';
import { Instrument } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CodeXml } from '@/components/ui/CodeXml';
import { EthicsBanner } from './EthicsBanner';
import { cn } from '@/lib/cn';

type Tab = 'xml' | 'base64' | 'deflate' | 'redirect';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'xml', label: 'XML', hint: 'Raw payload' },
  { id: 'base64', label: 'Base64', hint: 'HTTP-POST binding' },
  { id: 'deflate', label: 'Base64 + DEFLATE', hint: 'HTTP-Redirect binding' },
  { id: 'redirect', label: 'Redirect param', hint: 'URL-encoded query value' },
];

const CATEGORY_ORDER: AttackCategory[] = ['wrapping', 'exclusion', 'comment', 'namespace', 'encoding'];

export function Generator() {
  const [source, setSource] = useState<string>(SAMPLE_XML[DEFAULT_SAMPLE_ID]);
  const [sampleChoice, setSampleChoice] = useState<string>(DEFAULT_SAMPLE_ID);
  const [attackId, setAttackId] = useState<string>('xsw3');
  const [params, setParams] = useState<AttackParams>({ nameId: 'admin@example.com', commentTail: '.attacker.example' });
  const [tab, setTab] = useState<Tab>('xml');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const attack = getAttack(attackId) ?? ATTACKS[0];

  const result = useMemo(() => (mounted ? attack.generate(source, params) : null), [mounted, attack, source, params]);

  const encoded = useMemo(() => {
    if (!result?.ok || !result.maliciousXML) return null;
    try {
      return {
        base64: encodeBase64(result.maliciousXML),
        deflate: encodeBase64Deflate(result.maliciousXML),
        redirect: encodeRedirectParam(result.maliciousXML),
      };
    } catch {
      return null;
    }
  }, [result]);

  const grouped = useMemo(() => {
    const by: Record<string, typeof ATTACKS> = {};
    for (const a of ATTACKS) (by[a.category] ??= []).push(a);
    return by;
  }, []);

  const loadSample = (id: string) => {
    setSampleChoice(id);
    if (id) setSource(SAMPLE_XML[id] ?? '');
  };
  const editSource = (v: string) => {
    setSource(v);
    setSampleChoice('');
  };

  const activeText =
    tab === 'xml'
      ? result?.maliciousXML ?? ''
      : tab === 'base64'
        ? encoded?.base64 ?? ''
        : tab === 'deflate'
          ? encoded?.deflate ?? ''
          : encoded?.redirect ?? '';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <header className="pb-5 pt-8">
        <h1 className="max-w-3xl text-title font-semibold text-ink sm:text-display">Attack generator</h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-soft">
          Paste a legitimate SAMLResponse from your own test environment, pick an attack class, and get the transformed
          payload — with a plain explanation of what it does and the SP condition that makes it work. Everything runs in
          your browser.
        </p>
      </header>

      <EthicsBanner />

      <details className="group mt-3 rounded-lg border border-line bg-surface open:pb-4">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink-soft hover:text-ink">
          How this stays cryptographically valid — click to read the guarantee
        </summary>
        <div className="max-w-prose px-4 text-sm leading-relaxed text-ink-soft">
          <p>
            Each transform runs on one mutable DOM, parsed once from your input. Before any element is edited, the
            node the signature actually references is either <strong className="font-medium text-ink">cloned first</strong>{' '}
            (the untouched clone becomes what the Reference resolves to) or left{' '}
            <strong className="font-medium text-ink">entirely unmutated</strong> and only relocated — moved by DOM
            operations (<code className="font-mono text-xs">cloneNode</code>, <code className="font-mono text-xs">insertBefore</code>,{' '}
            <code className="font-mono text-xs">appendChild</code>), never rebuilt from re-parsed text. It is serialized
            back to XML exactly once, at the very end, for the whole document.
          </p>
          <p className="mt-2">
            That is the correct bar, not a weaker stand-in for one: a validator always re-parses and re-canonicalizes
            whatever you send it — it never diffs raw bytes against the wire. So the guarantee that matters is DOM-level
            fidelity of the signed subtree, not literal octet-for-octet reuse of your input, and that is what this
            engine gives every variant here.
          </p>
          <p className="mt-2">
            What this does <em>not</em> mean: it has not been checked against a live XML-DSig verifier or a real,
            IdP-signed response — there is no signing key or canonicalizer in this tool to test against. Treat a
            generated payload as structurally correct, and confirm against your own authorized target before relying
            on it.
          </p>
        </div>
      </details>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Controls */}
        <div className="flex flex-col gap-4">
          <Instrument title="Source SAMLResponse">
            <div className="flex flex-col gap-3 p-3">
              <label htmlFor="atk-source" className="sr-only">
                Source SAMLResponse
              </label>
              <textarea
                id="atk-source"
                value={source}
                onChange={(e) => editSource(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="Paste a legitimate SAMLResponse (raw XML) from a system you are authorized to test."
                className="h-48 w-full resize-y rounded-md border border-line bg-surface-sunken p-3 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-ink-soft/60 focus-visible:border-blueprint-soft"
              />
              <div className="flex items-center gap-2">
                <select
                  aria-label="Load an example source"
                  value={sampleChoice}
                  onChange={(e) => loadSample(e.target.value)}
                  className="h-8 rounded-md border border-line bg-surface pl-3 pr-8 text-sm text-ink outline-none hover:border-blueprint-soft focus-visible:border-blueprint-soft"
                >
                  <option value="">Load example…</option>
                  {SAMPLES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="ghost" onClick={() => editSource('')} disabled={!source}>
                  Clear
                </Button>
              </div>
              <p className="text-xs leading-relaxed text-ink-soft">
                Raw XML in. Every transform clones the signed element before making any edit — the reference a real
                signature resolves to is never mutated, only relocated — so it canonicalizes identically and the
                signature stays valid where the attack relies on it.
              </p>
            </div>
          </Instrument>

          <Instrument title="Attack">
            <div className="flex flex-col gap-3 p-3">
              <label htmlFor="atk-select" className="sr-only">
                Attack class
              </label>
              <select
                id="atk-select"
                value={attackId}
                onChange={(e) => setAttackId(e.target.value)}
                className="h-9 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none hover:border-blueprint-soft focus-visible:border-blueprint-soft"
              >
                {CATEGORY_ORDER.filter((c) => grouped[c]?.length).map((c) => (
                  <optgroup key={c} label={CATEGORY_LABEL[c]}>
                    {grouped[c].map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <div>
                <p className="text-sm font-medium text-ink">{attack.tagline}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{attack.description}</p>
              </div>

              {attack.params.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-line pt-3">
                  {attack.params.map((p) => (
                    <div key={p.key}>
                      <label htmlFor={`p-${p.key}`} className="mb-1 block text-xs font-medium text-ink-soft">
                        {p.label}
                      </label>
                      <input
                        id={`p-${p.key}`}
                        type="text"
                        value={params[p.key] ?? ''}
                        placeholder={p.placeholder}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: e.target.value }))}
                        className="w-full rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-sm text-ink outline-none focus-visible:border-blueprint-soft"
                      />
                      {p.help && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.help}</p>}
                    </div>
                  ))}
                </div>
              )}

              {(attack.relatedCVEs.length > 0 || attack.affectedParsers.length > 0) && (
                <div className="border-t border-line pt-3">
                  {attack.affectedParsers.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-medium text-ink-soft">Typically affects</p>
                      <ul className="flex flex-col gap-0.5 text-xs text-ink">
                        {attack.affectedParsers.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {attack.relatedCVEs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attack.relatedCVEs.map((c) => (
                        <Badge key={c} tone="neutral" mono>
                          {c}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Instrument>
        </div>

        {/* Payload + explanation */}
        <div className="flex min-w-0 flex-col gap-4">
          <Instrument
            title="Payload"
            className="min-w-0"
            meta={<CopyButton value={activeText} label={`Copy ${tab === 'xml' ? 'XML' : tab === 'redirect' ? 'param' : 'Base64'}`} />}
            bodyClassName="flex flex-col"
          >
            <div className="flex flex-wrap gap-1 border-b border-line px-2 py-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  title={t.hint}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs transition-colors',
                    tab === t.id ? 'bg-[var(--blueprint-tint)] font-medium text-blueprint' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <p className="border-b border-line bg-[var(--warn-tint)] px-3 py-1.5 text-[11px] leading-relaxed text-ink-soft">
              Only effective against an SP that is already vulnerable. Send it only to systems you own or are authorized
              to test.
            </p>

            {mounted && result && !result.ok ? (
              <div className="px-4 py-10">
                <div className="mx-auto max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-unsigned" aria-hidden />
                    <h3 className="text-subhead font-semibold text-ink">Couldn’t generate this payload</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{result.error}</p>
                </div>
              </div>
            ) : !mounted ? (
              <div className="space-y-2 p-4" aria-hidden>
                {[70, 55, 62, 48].map((w, i) => (
                  <div key={i} className="h-3.5 animate-pulse rounded bg-surface-sunken" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <div className="max-h-[520px] overflow-auto p-3">
                {tab === 'xml' ? (
                  <CodeXml src={activeText} />
                ) : (
                  <pre className="overflow-auto whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-ink">
                    {activeText}
                  </pre>
                )}
              </div>
            )}
          </Instrument>

          {mounted && result?.ok && (
            <Instrument title="Why this works">
              <div className="flex flex-col divide-y divide-line">
                <div className="px-4 py-4">
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">What it does</h4>
                  <p className="max-w-prose text-sm leading-relaxed text-ink">{result.explanation}</p>
                </div>
                <div className="px-4 py-4">
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">The condition it needs</h4>
                  <p className="max-w-prose text-sm leading-relaxed text-ink">{result.whyItWorks}</p>
                </div>
                {result.context.notes.length > 0 && (
                  <div className="px-4 py-4">
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Notes on your source</h4>
                    <ul className="flex flex-col gap-1">
                      {result.context.notes.map((note) => (
                        <li key={note} className="max-w-prose text-sm leading-relaxed text-warn">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Instrument>
          )}
        </div>
      </div>
    </div>
  );
}
