import pako from 'pako';
import type { DecodeResult, Encoding } from './types';

export const MAX_INPUT_BYTES = 5 * 1024 * 1024; // 5 MB guard (spec §10)

const decoder = new TextDecoder('utf-8', { fatal: false });
const encoder = new TextEncoder();

function looksLikeXml(s: string): boolean {
  return /^﻿?\s*</.test(s);
}

function binaryStringToBytes(bin: string): Uint8Array {
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 0xff;
  return bytes;
}

/** Base64 → bytes. Throws on invalid input. Tolerates whitespace and URL-safe alphabet. */
function base64ToBytes(input: string): Uint8Array {
  let cleaned = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  // Pad to a multiple of 4.
  const pad = cleaned.length % 4;
  if (pad === 2) cleaned += '==';
  else if (pad === 3) cleaned += '=';
  else if (pad === 1) throw new Error('bad-length');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) throw new Error('bad-alphabet');
  const bin = atob(cleaned);
  return binaryStringToBytes(bin);
}

/**
 * Detect the encoding of a pasted SAML blob and return the decoded XML.
 * This is the entire wire pipeline, run automatically and in the order SAML
 * actually travels — the caller never has to know or pick the steps:
 *   1. URL-decode, if the blob was lifted from a query string (Redirect binding).
 *   2. Base64-decode.
 *   3. Inflate (raw DEFLATE, or zlib as a fallback some producers use) — only
 *      when the Base64 bytes are compressed rather than already being XML.
 * Each step is skipped automatically when the input doesn't need it (e.g. XML
 * copied straight out of a debugger needs none of them), and exactly which
 * steps ran is reported back in `urlDecoded` / `encoding` so the UI can show
 * its work rather than asserting it.
 */
export function decodeSAML(input: string): DecodeResult {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { ok: false, encoding: null, urlDecoded: false, xml: '', error: { title: 'Nothing to decode', detail: 'Paste a SAMLResponse to begin, or load the example.' } };
  }

  if (encoder.encode(trimmed).length > MAX_INPUT_BYTES) {
    return {
      ok: false,
      encoding: null,
      urlDecoded: false,
      xml: '',
      error: { title: 'That input is very large', detail: 'The decoder caps input at 5 MB to keep your browser responsive. Trim the blob to just the SAMLResponse and try again.' },
    };
  }

  // 1. Raw XML — no decoding needed at all.
  if (looksLikeXml(trimmed)) {
    return { ok: true, encoding: 'raw', urlDecoded: false, xml: trimmed };
  }

  // Step 1: URL-decode, only if the blob actually looks URL-encoded. Base64's
  // alphabet (A-Z a-z 0-9 + / - _ =) never contains a literal '%', so seeing
  // one is a reliable signal — never a false trigger on real Base64.
  let candidate = trimmed;
  let urlDecoded = false;
  if (/%[0-9a-fA-F]{2}/.test(candidate)) {
    try {
      candidate = decodeURIComponent(candidate);
      urlDecoded = true;
    } catch {
      /* leave as-is; base64 step will report */
    }
    if (looksLikeXml(candidate.trim())) {
      return { ok: true, encoding: 'raw', urlDecoded, xml: candidate.trim() };
    }
  }

  // Step 2: Base64-decode.
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(candidate);
  } catch {
    return {
      ok: false,
      encoding: null,
      urlDecoded,
      xml: '',
      error: {
        title: "Couldn't decode this as Base64",
        detail: 'It is not raw XML and not valid Base64. If it came from a URL, it may be URL-encoded first, or it may be truncated.',
      },
    };
  }

  // Plain Base64 → XML (HTTP-POST binding never deflates)?
  const asText = decoder.decode(bytes);
  if (looksLikeXml(asText)) {
    return { ok: true, encoding: 'base64', urlDecoded, xml: asText.trim() };
  }

  // Step 3: inflate (redirect binding uses raw DEFLATE; some producers use zlib).
  for (const inflate of [pako.inflateRaw, pako.inflate] as const) {
    try {
      const out = inflate(bytes, { to: 'string' }) as string;
      if (looksLikeXml(out)) {
        return { ok: true, encoding: 'base64+deflate', urlDecoded, xml: out.trim() };
      }
    } catch {
      /* try next strategy */
    }
  }

  return {
    ok: false,
    encoding: null,
    urlDecoded,
    xml: '',
    error: {
      title: "Decoded, but it isn't XML",
      detail: 'The Base64 decoded successfully but the result is not XML (nor DEFLATE-compressed XML). Double-check you copied the whole SAMLResponse value.',
    },
  };
}

const ENCODING_LABEL: Record<Encoding, string> = {
  raw: 'Raw XML',
  base64: 'Base64',
  'base64+deflate': 'Base64 + DEFLATE',
};

export function encodingLabel(e: Encoding): string {
  return ENCODING_LABEL[e];
}
