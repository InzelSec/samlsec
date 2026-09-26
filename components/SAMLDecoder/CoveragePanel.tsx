'use client';

import type { SAMLAnatomy } from '@/lib/saml/types';
import { algoLabel, isWeakAlgo } from '@/lib/saml/algorithms';
import { Badge, Dot } from '@/components/ui/Badge';

export function CoveragePanel({
  anatomy,
  onFocusNode,
}: {
  anatomy: SAMLAnatomy;
  onFocusNode: (nodeId: string) => void;
}) {
  const { assertions, signatures } = anatomy;
  const signedCount = assertions.filter((a) => a.signed).length;
  const unsignedCount = assertions.length - signedCount;

  return (
    <div className="flex flex-col divide-y divide-line">
      <Verdict signatureCount={signatures.length} assertionTotal={assertions.length} unsignedCount={unsignedCount} />

      {assertions.length > 0 && (
        <Section title="Assertions">
          <ul className="flex flex-col gap-2">
            {assertions.map((a, i) => (
              <li key={a.nodeId}>
                <button
                  type="button"
                  onClick={() => onFocusNode(a.nodeId)}
                  className="group flex w-full items-start gap-2.5 rounded-md border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-blueprint-soft"
                >
                  <span className="mt-1">
                    <Dot tone={a.signed ? 'signed' : 'unsigned'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">
                        Assertion {assertions.length > 1 ? i + 1 : ''}
                      </span>
                      <Badge tone={a.signed ? 'signed' : 'unsigned'}>
                        {a.signed ? 'covered' : 'not covered'}
                      </Badge>
                    </span>
                    {a.id && (
                      <span className="mt-0.5 block truncate font-mono text-xs text-ink-soft" title={a.id}>
                        ID={a.id}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {signatures.length > 0 && (
        <Section title={signatures.length > 1 ? 'Signatures' : 'Signature'}>
          <div className="flex flex-col gap-4">
            {signatures.map((sig, i) => (
              <div key={sig.signatureNodeId || i} className="text-sm">
                <button
                  type="button"
                  onClick={() => sig.targetNodeId && onFocusNode(sig.targetNodeId)}
                  className="mb-2 inline-flex items-center gap-2 text-xs text-ink-soft hover:text-blueprint disabled:hover:text-ink-soft"
                  disabled={!sig.targetNodeId}
                >
                  {sig.resolves ? (
                    <>
                      Reference{' '}
                      <code className="font-mono text-blueprint">{sig.referenceURI || '(whole document)'}</code> resolves
                    </>
                  ) : (
                    <span className="text-unsigned">
                      Reference <code className="font-mono">{sig.referenceURI || '(empty)'}</code> resolves to nothing
                    </span>
                  )}
                </button>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                  <Algo label="Canonicalization" uri={sig.canonicalizationMethod} />
                  <Algo label="Signature" uri={sig.signatureMethod} />
                  <Algo label="Digest" uri={sig.digestMethod} />
                  {sig.transforms.length > 0 && (
                    <>
                      <dt className="text-ink-soft">Transforms</dt>
                      <dd className="flex flex-wrap gap-1">
                        {sig.transforms.map((t, j) => (
                          <Badge key={j} tone={isWeakAlgo(t) ? 'warn' : 'neutral'} mono>
                            {algoLabel(t)}
                          </Badge>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Identity & conditions">
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
          <Fact label="NameID" value={anatomy.nameId?.value} mono />
          <Fact label="Issuer" value={anatomy.issuer} mono />
          <Fact label="Destination" value={anatomy.destination} mono />
          <Fact label="Not before" value={anatomy.conditions?.notBefore} mono />
          <Fact label="Not on/after" value={anatomy.conditions?.notOnOrAfter} mono />
        </dl>
        {anatomy.attributes.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-ink-soft">Attributes</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
              {anatomy.attributes.map((attr) => (
                <div key={attr.name} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="truncate text-ink-soft" title={attr.name}>
                    {attr.name}
                  </dt>
                  <dd className="text-ink">{attr.values.join(', ') || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Section>
    </div>
  );
}

function Verdict({
  signatureCount,
  assertionTotal,
  unsignedCount,
}: {
  signatureCount: number;
  assertionTotal: number;
  unsignedCount: number;
}) {
  let tone: 'signed' | 'unsigned' | 'warn' = 'signed';
  let headline = '';
  let detail = '';

  if (signatureCount === 0) {
    tone = 'unsigned';
    headline = 'No signature present';
    detail =
      'Nothing in this document is cryptographically protected. A Service Provider that accepts it is trusting the transport alone.';
  } else if (unsignedCount > 0 && unsignedCount < assertionTotal) {
    tone = 'unsigned';
    headline = `${unsignedCount} of ${assertionTotal} assertions are not covered`;
    detail =
      'A signature covers one assertion while another is left uncovered — the exact shape of a signature-wrapping (XSW) attack. Which one does the SP actually read?';
  } else if (unsignedCount === assertionTotal && assertionTotal > 0) {
    tone = 'warn';
    headline = 'A signature exists, but no assertion is covered';
    detail = 'The reference does not resolve to any assertion in this document. Check what the signature actually points at.';
  } else if (assertionTotal === 0) {
    tone = 'warn';
    headline = 'A signature exists, but there is no assertion';
    detail = 'This document carries a signature yet contains no SAML assertion to cover.';
  } else {
    tone = 'signed';
    headline = assertionTotal === 1 ? 'The assertion is covered by a signature' : `All ${assertionTotal} assertions are covered`;
    detail =
      'Structurally, every assertion falls under a signature reference. This tool does not verify the signature cryptographically — only what it covers.';
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-2">
        <Dot tone={tone} />
        <h3 className="text-subhead font-semibold text-ink">{headline}</h3>
      </div>
      <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-ink-soft">{detail}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h4>
      {children}
    </div>
  );
}

function Algo({ label, uri }: { label: string; uri: string }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="flex items-center gap-1.5">
        <span className="text-ink">{algoLabel(uri)}</span>
        {isWeakAlgo(uri) && <Badge tone="warn">weak</Badge>}
      </dd>
    </>
  );
}

function Fact({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className={value ? (mono ? 'break-all font-mono text-xs text-ink' : 'text-ink') : 'text-ink-soft/60'}>
        {value || '—'}
      </dd>
    </>
  );
}
