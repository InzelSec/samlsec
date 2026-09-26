'use client';

import { useMemo, useState } from 'react';
import { encodeBase64, encodeBase64Deflate, encodeRedirectParam } from '@/lib/saml/encode';
import { MAX_INPUT_BYTES } from '@/lib/saml/decode';
import { Instrument } from '@/components/ui/Panel';
import { CopyButton } from '@/components/ui/CopyButton';
import { PipelineTrail } from '@/components/ui/PipelineTrail';

const byteLength = (s: string) => new TextEncoder().encode(s).length;

type EncodeState =
  | { kind: 'empty' }
  | { kind: 'too-large' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; post: string; redirectRaw: string; redirectParam: string };

function encode(xml: string): EncodeState {
  const trimmed = xml.trim();
  if (!trimmed) return { kind: 'empty' };
  if (byteLength(trimmed) > MAX_INPUT_BYTES) return { kind: 'too-large' };
  try {
    return {
      kind: 'ok',
      post: encodeBase64(trimmed),
      redirectRaw: encodeBase64Deflate(trimmed),
      redirectParam: encodeRedirectParam(trimmed),
    };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : 'Could not encode this input.' };
  }
}

export function EncodePanel() {
  const [xml, setXml] = useState<string>('');

  const result = useMemo(() => encode(xml), [xml]);

  return (
    <div className="flex flex-col gap-4">
      <Instrument title="XML to encode">
        <div className="flex flex-col gap-3 p-3">
          <label htmlFor="saml-xml-input" className="sr-only">
            SAML XML to encode
          </label>
          <textarea
            id="saml-xml-input"
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Paste or write the raw SAML XML to encode — a Response, an Assertion, an AuthnRequest…"
            className="h-40 w-full resize-y rounded-md border border-line bg-surface-sunken p-3 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-ink-soft/60 focus-visible:border-blueprint-soft lg:h-56"
          />
          <p className="text-xs leading-relaxed text-ink-soft">
            Encoded byte-for-byte from exactly what is in this box — we never reparse or reformat your XML first, since
            that could silently change a signed document. Nothing leaves your browser.
          </p>
        </div>
      </Instrument>

      <Instrument title="Wire formats" meta={result.kind === 'ok' ? <span className="hidden sm:inline">produced automatically</span> : null}>
        {result.kind === 'empty' && (
          <p className="p-4 text-sm leading-relaxed text-ink-soft">
            Provide some XML above to see it encoded for both SAML bindings here.
          </p>
        )}
        {result.kind === 'too-large' && (
          <p className="p-4 text-sm leading-relaxed text-ink-soft">
            That input is larger than the 5 MB the encoder will process in-browser. Trim it down and try again.
          </p>
        )}
        {result.kind === 'error' && <p className="p-4 text-sm leading-relaxed text-unsigned">{result.message}</p>}
        {result.kind === 'ok' && (
          <div className="flex flex-col divide-y divide-line">
            <OutputRow
              label="HTTP-POST binding"
              hint="The SAMLResponse form field value for a POST-bound response."
              steps={['Base64-encoded']}
              value={result.post}
            />
            <OutputRow
              label="HTTP-Redirect binding"
              hint="Ready to paste as the SAMLResponse query-string parameter."
              steps={['Deflated (raw)', 'Base64-encoded', 'URL-encoded']}
              value={result.redirectParam}
              primary
            />
            <details className="group px-3 py-3">
              <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">
                Intermediate value: Base64 + DEFLATE, before URL-encoding
              </summary>
              <div className="mt-3">
                <OutputRow steps={['Deflated (raw)', 'Base64-encoded']} value={result.redirectRaw} bare />
              </div>
            </details>
          </div>
        )}
      </Instrument>
    </div>
  );
}

function OutputRow({
  label,
  hint,
  steps,
  value,
  primary,
  bare,
}: {
  label?: string;
  hint?: string;
  steps: string[];
  value: string;
  primary?: boolean;
  bare?: boolean;
}) {
  return (
    <div className={bare ? '' : 'p-3'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          {label && (
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              {label}
              {primary && <span className="text-xs font-normal text-ink-soft">— most SPs expect this one</span>}
            </span>
          )}
          <PipelineTrail steps={steps} />
        </div>
        <CopyButton value={value} label="Copy" />
      </div>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{hint}</p>}
      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-md border border-line bg-surface-sunken p-2.5 font-mono text-[11px] leading-relaxed text-ink-soft">
        {value}
      </pre>
    </div>
  );
}
