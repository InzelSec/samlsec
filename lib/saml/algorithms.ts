// Human-readable short names for the XML-DSig algorithm URIs that show up in
// SAML signatures. Falls back to the last path/fragment segment.
const MAP: Record<string, string> = {
  'http://www.w3.org/2000/09/xmldsig#rsa-sha1': 'RSA-SHA1',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256': 'RSA-SHA256',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha384': 'RSA-SHA384',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512': 'RSA-SHA512',
  'http://www.w3.org/2000/09/xmldsig#dsa-sha1': 'DSA-SHA1',
  'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256': 'ECDSA-SHA256',
  'http://www.w3.org/2000/09/xmldsig#sha1': 'SHA-1',
  'http://www.w3.org/2001/04/xmlenc#sha256': 'SHA-256',
  'http://www.w3.org/2001/04/xmlenc#sha512': 'SHA-512',
  'http://www.w3.org/2001/10/xml-exc-c14n#': 'Exclusive C14N',
  'http://www.w3.org/2001/10/xml-exc-c14n#WithComments': 'Exclusive C14N (with comments)',
  'http://www.w3.org/TR/2001/REC-xml-c14n-20010315': 'Canonical XML 1.0',
  'http://www.w3.org/2006/12/xml-c14n11': 'Canonical XML 1.1',
  'http://www.w3.org/2000/09/xmldsig#enveloped-signature': 'Enveloped signature',
};

/** Algorithms considered weak/deprecated — flagged in the UI. */
const WEAK = new Set([
  'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  'http://www.w3.org/2000/09/xmldsig#dsa-sha1',
  'http://www.w3.org/2000/09/xmldsig#sha1',
]);

export function algoLabel(uri: string): string {
  if (!uri) return '—';
  if (MAP[uri]) return MAP[uri];
  const frag = uri.split('#').pop() || uri.split('/').pop() || uri;
  return frag;
}

export function isWeakAlgo(uri: string): boolean {
  return WEAK.has(uri);
}
