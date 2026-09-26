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
      <header className="pb-4 pt-6">
        <h1 className="text-heading font-semibold text-ink">Attacks</h1>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
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
        </div>
      </div>
    </div>
  );
}
