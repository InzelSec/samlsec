// Shared shapes for the SAML decoder pipeline.
// These follow the SAMLAnatomy / SignatureInfo contract in the site spec (3.1).

export type Encoding = 'raw' | 'base64' | 'base64+deflate';

/** Roles we color and label in the anatomy overlay. */
export type AnatomyRole =
  | 'assertion'
  | 'signature'
  | 'reference'
  | 'digest'
  | 'signature-value'
  | 'nameid'
  | 'conditions'
  | 'attribute';

export interface DecodeResult {
  ok: boolean;
  encoding: Encoding | null;
  /** Decoded XML text (best effort even if not well-formed). */
  xml: string;
  /** User-facing explanation when ok === false. */
  error?: DecodeError;
}

export interface DecodeError {
  /** Short headline in the interface's voice. */
  title: string;
  /** What to do about it. */
  detail: string;
  /** Optional 1-indexed line the problem points at. */
  line?: number;
}

export interface SignatureInfo {
  /** The value of ds:Reference/@URI, e.g. "#_a1b2c3" (empty string = whole-doc). */
  referenceURI: string;
  /** The element id the reference resolves to (URI without the leading '#'). */
  resolvesToId: string | null;
  /** Whether an element with that id actually exists in the document. */
  resolves: boolean;
  digestValue: string;
  digestMethod: string;
  signatureValue: string;
  signatureMethod: string;
  canonicalizationMethod: string;
  transforms: string[];
  /** Node id (our synthetic id) of the Signature element, for overlay wiring. */
  signatureNodeId: string;
  /** Node id of the ds:Reference element (the line the connector starts from). */
  referenceNodeId: string | null;
  /** Node id of the element the reference resolves to, if present. */
  targetNodeId: string | null;
}

export interface AttributeInfo {
  name: string;
  values: string[];
}

export interface SAMLAnatomy {
  isSAML: boolean;
  rootName: string;
  encoding: Encoding | null;
  raw: string;
  assertions: { nodeId: string; id: string | null; signed: boolean }[];
  signatures: SignatureInfo[];
  nameId: { value: string; format: string | null } | null;
  attributes: AttributeInfo[];
  conditions: { notBefore?: string; notOnOrAfter?: string } | null;
  issuer: string | null;
  destination: string | null;
  /** Synthetic ids of elements NOT covered by any signature reference. */
  unsignedNodeIds: string[];
  /** Synthetic ids of elements covered by a signature reference. */
  signedNodeIds: string[];
}
