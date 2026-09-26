import pako from 'pako';

const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** Base64 (HTTP-POST binding). Unicode-safe. */
export function encodeBase64(xml: string): string {
  return bytesToBase64(encoder.encode(xml));
}

/** Base64 + raw DEFLATE (HTTP-Redirect binding). */
export function encodeBase64Deflate(xml: string): string {
  const deflated = pako.deflateRaw(encoder.encode(xml));
  return bytesToBase64(deflated);
}

/** URL-encoded form of the redirect-binding value (what goes on the query string). */
export function encodeRedirectParam(xml: string): string {
  return encodeURIComponent(encodeBase64Deflate(xml));
}
