export type AttackCategory = 'wrapping' | 'exclusion' | 'comment' | 'namespace' | 'encoding';

export interface AttackParamSpec {
  key: 'nameId' | 'commentTail' | 'issuer';
  label: string;
  placeholder: string;
  /** Sensible default so the generator produces something immediately. */
  default: string;
  help?: string;
}

export interface AttackParams {
  nameId?: string;
  commentTail?: string;
  issuer?: string;
}

export interface GenerateContext {
  /** Whether the source document actually had a signature to work with. */
  hadSignature: boolean;
  /** Number of assertions found in the source. */
  assertionCount: number;
  /** Non-fatal notes about the source (e.g. "no signature found"). */
  notes: string[];
}

export interface AttackResult {
  ok: boolean;
  /** The generated payload (raw XML string). Empty when ok === false. */
  maliciousXML: string;
  /** Why the transformation was refused, in the interface's voice. */
  error?: string;
  /** What the transformation did, structurally. */
  explanation: string;
  /** The condition on the target SP that makes it work. */
  whyItWorks: string;
  context: GenerateContext;
}

export interface AttackModule {
  id: string;
  name: string;
  /** Short subtitle shown under the name. */
  tagline: string;
  category: AttackCategory;
  description: string;
  /** Where this class of bug has been seen. */
  affectedParsers: string[];
  relatedCVEs: string[];
  /** Which parameters this attack reads. */
  params: AttackParamSpec[];
  generate(legitXML: string, params: AttackParams): AttackResult;
}

export const CATEGORY_LABEL: Record<AttackCategory, string> = {
  wrapping: 'Signature wrapping',
  exclusion: 'Signature exclusion',
  comment: 'Comment injection',
  namespace: 'Namespace manipulation',
  encoding: 'Encoding & declaration',
};
