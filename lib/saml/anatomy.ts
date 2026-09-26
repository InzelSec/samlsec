import { DOMParser } from '@xmldom/xmldom';
import type {
  AnatomyRole,
  AttributeInfo,
  DecodeError,
  SAMLAnatomy,
  SignatureInfo,
} from './types';

// Minimal structural typing so we don't depend on xmldom's exported DOM types,
// which differ from lib.dom. Everything we touch is covered here.
export interface XmlNode {
  nodeType: number;
  nodeName: string;
  localName?: string | null;
  prefix?: string | null;
  namespaceURI?: string | null;
  nodeValue?: string | null;
  textContent?: string | null;
  childNodes: { length: number; item(i: number): XmlNode | null };
  attributes?: {
    length: number;
    item(i: number): { nodeName: string; localName?: string | null; prefix?: string | null; value: string } | null;
  } | null;
  getAttribute?(name: string): string | null;
}

export const NODE = { ELEMENT: 1, TEXT: 3, CDATA: 4, COMMENT: 8, DOCUMENT: 9 } as const;

const NS = {
  assertion: 'urn:oasis:names:tc:SAML:2.0:assertion',
  protocol: 'urn:oasis:names:tc:SAML:2.0:protocol',
  dsig: 'http://www.w3.org/2000/09/xmldsig#',
};

const SAML_ROOTS = new Set([
  'Response',
  'LogoutResponse',
  'AuthnRequest',
  'LogoutRequest',
  'Assertion',
  'ArtifactResponse',
]);

export interface ParsedSAML {
  ok: boolean;
  parseError?: DecodeError;
  root: XmlNode | null;
  anatomy: SAMLAnatomy;
  /** Synthetic, document-order id for an element (used to wire the overlay). */
  nodeIdOf: (el: XmlNode) => string | undefined;
  roleOf: (el: XmlNode) => AnatomyRole | undefined;
  /** True if this element (by nodeId) sits inside a signed region. */
  isSigned: (nodeId: string) => boolean;
}

function isElement(n: XmlNode): boolean {
  return n.nodeType === NODE.ELEMENT;
}

function local(n: XmlNode): string {
  return (n.localName || n.nodeName || '').replace(/^.*:/, '');
}

function* elementsByLocal(root: XmlNode, name: string): Generator<XmlNode> {
  const stack: XmlNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (isElement(n) && local(n) === name) yield n;
    const kids = n.childNodes;
    for (let i = kids.length - 1; i >= 0; i--) {
      const c = kids.item(i);
      if (c) stack.push(c);
    }
  }
}

function firstByLocal(root: XmlNode, name: string): XmlNode | null {
  for (const el of elementsByLocal(root, name)) return el;
  return null;
}

function attr(el: XmlNode, name: string): string | null {
  return el.getAttribute ? el.getAttribute(name) : null;
}

function text(el: XmlNode | null): string {
  if (!el) return '';
  return (el.textContent || '').trim();
}

/** Assign a stable, document-order id to every element. */
function indexNodes(root: XmlNode): {
  idMap: WeakMap<object, string>;
  order: XmlNode[];
} {
  const idMap = new WeakMap<object, string>();
  const order: XmlNode[] = [];
  let counter = 0;
  const walk = (n: XmlNode) => {
    if (isElement(n)) {
      idMap.set(n as object, `n${counter++}`);
      order.push(n);
    }
    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const c = kids.item(i);
      if (c) walk(c);
    }
  };
  walk(root);
  return { idMap, order };
}

function collectRoles(root: XmlNode): WeakMap<object, AnatomyRole> {
  const roles = new WeakMap<object, AnatomyRole>();
  const set = (name: string, role: AnatomyRole) => {
    for (const el of elementsByLocal(root, name)) roles.set(el as object, role);
  };
  // Order matters least here since each name is distinct.
  set('Assertion', 'assertion');
  set('Signature', 'signature');
  set('Reference', 'reference');
  set('DigestValue', 'digest');
  set('SignatureValue', 'signature-value');
  set('NameID', 'nameid');
  set('Conditions', 'conditions');
  set('Attribute', 'attribute');
  return roles;
}

/** Find the element an id-reference (URI without '#') resolves to. */
function findById(root: XmlNode, id: string): XmlNode | null {
  if (id === '') return root; // empty URI = whole document
  const stack: XmlNode[] = [root];
  while (stack.length) {
    const n = stack.pop()!;
    if (isElement(n)) {
      if (attr(n, 'ID') === id || attr(n, 'Id') === id || attr(n, 'id') === id) return n;
    }
    const kids = n.childNodes;
    for (let i = kids.length - 1; i >= 0; i--) {
      const c = kids.item(i);
      if (c) stack.push(c);
    }
  }
  return null;
}

function emptyAnatomy(raw: string): SAMLAnatomy {
  return {
    isSAML: false,
    rootName: '',
    encoding: null,
    raw,
    assertions: [],
    signatures: [],
    nameId: null,
    attributes: [],
    conditions: null,
    issuer: null,
    destination: null,
    unsignedNodeIds: [],
    signedNodeIds: [],
  };
}

export function parseSAML(xml: string): ParsedSAML {
  let parseError: DecodeError | undefined;
  let doc: XmlNode | null = null;

  const errors: { level: string; message: string }[] = [];
  try {
    const parser = new DOMParser({
      onError: (level: string, message: string) => {
        errors.push({ level, message });
      },
    } as unknown as ConstructorParameters<typeof DOMParser>[0]);
    doc = parser.parseFromString(xml, 'text/xml') as unknown as XmlNode;
  } catch (e) {
    const locator = (e as { locator?: { lineNumber?: number } })?.locator;
    parseError = {
      title: "That doesn't look like valid XML",
      detail: e instanceof Error ? cleanupParseMessage(e.message) : 'The parser could not read the document.',
      line: locator?.lineNumber,
    };
  }

  const fatal = errors.find((e) => e.level === 'fatalError') || errors.find((e) => e.level === 'error');
  if (!parseError && fatal) {
    parseError = {
      title: "That doesn't look like valid XML",
      detail: cleanupParseMessage(fatal.message),
      line: extractLine(fatal.message),
    };
  }

  // Locate the document element (skip declaration / comments / whitespace).
  let root: XmlNode | null = null;
  if (doc) {
    const kids = doc.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const c = kids.item(i);
      if (c && isElement(c)) {
        root = c;
        break;
      }
    }
  }

  if (!root) {
    return {
      ok: false,
      parseError:
        parseError || {
          title: "That doesn't look like valid XML",
          detail: 'No XML element was found in the input. Make sure you pasted the decoded document.',
        },
      root: null,
      anatomy: emptyAnatomy(xml),
      nodeIdOf: () => undefined,
      roleOf: () => undefined,
      isSigned: () => false,
    };
  }

  const { idMap } = indexNodes(root);
  const roleMap = collectRoles(root);
  const nodeIdOf = (el: XmlNode) => idMap.get(el as object);
  const roleOf = (el: XmlNode) => roleMap.get(el as object);

  const rootName = local(root);
  const containsAssertion = !!firstByLocal(root, 'Assertion');
  const isSAML =
    SAML_ROOTS.has(rootName) ||
    root.namespaceURI === NS.protocol ||
    root.namespaceURI === NS.assertion ||
    containsAssertion;

  // Signatures.
  const signatures: SignatureInfo[] = [];
  const signedNodeIds = new Set<string>();
  for (const sig of elementsByLocal(root, 'Signature')) {
    // Only treat XML-DSig signatures (ignore anything oddly named).
    const refEl = firstByLocal(sig, 'Reference');
    const referenceURI = refEl ? attr(refEl, 'URI') || '' : '';
    const resolvesToId = referenceURI.startsWith('#') ? referenceURI.slice(1) : referenceURI === '' ? '' : referenceURI;
    const target = refEl ? findById(root, resolvesToId) : null;
    const targetNodeId = target ? nodeIdOf(target) || null : null;
    if (targetNodeId) markSubtreeSigned(target!, nodeIdOf, signedNodeIds);

    signatures.push({
      referenceURI,
      resolvesToId: refEl ? resolvesToId : null,
      resolves: !!target,
      digestValue: text(firstByLocal(sig, 'DigestValue')),
      digestMethod: attr(firstByLocal(sig, 'DigestMethod') || sig, 'Algorithm') || '',
      signatureValue: text(firstByLocal(sig, 'SignatureValue')),
      signatureMethod: attr(firstByLocal(sig, 'SignatureMethod') || sig, 'Algorithm') || '',
      canonicalizationMethod: attr(firstByLocal(sig, 'CanonicalizationMethod') || sig, 'Algorithm') || '',
      transforms: Array.from(elementsByLocal(sig, 'Transform'))
        .map((t) => attr(t, 'Algorithm') || '')
        .filter(Boolean),
      signatureNodeId: nodeIdOf(sig) || '',
      referenceNodeId: refEl ? nodeIdOf(refEl) || null : null,
      targetNodeId,
    });
  }

  // Assertions and their signed status.
  const assertions = Array.from(elementsByLocal(root, 'Assertion')).map((a) => {
    const nodeId = nodeIdOf(a) || '';
    const id = attr(a, 'ID') || attr(a, 'Id') || attr(a, 'id');
    return { nodeId, id, signed: signedNodeIds.has(nodeId) };
  });

  const unsignedNodeIds = assertions.filter((a) => !a.signed).map((a) => a.nodeId);

  // NameID.
  const nameIdEl = firstByLocal(root, 'NameID');
  const nameId = nameIdEl
    ? { value: text(nameIdEl), format: attr(nameIdEl, 'Format') }
    : null;

  // Attributes.
  const attributes: AttributeInfo[] = Array.from(elementsByLocal(root, 'Attribute')).map((a) => ({
    name: attr(a, 'Name') || attr(a, 'FriendlyName') || '(unnamed)',
    values: Array.from(elementsByLocal(a, 'AttributeValue')).map((v) => text(v)),
  }));

  // Conditions.
  const condEl = firstByLocal(root, 'Conditions');
  const conditions = condEl
    ? {
        notBefore: attr(condEl, 'NotBefore') || undefined,
        notOnOrAfter: attr(condEl, 'NotOnOrAfter') || undefined,
      }
    : null;

  const anatomy: SAMLAnatomy = {
    isSAML,
    rootName,
    encoding: null,
    raw: xml,
    assertions,
    signatures,
    nameId,
    attributes,
    conditions,
    issuer: text(firstByLocal(root, 'Issuer')) || null,
    destination: attr(root, 'Destination'),
    unsignedNodeIds,
    signedNodeIds: Array.from(signedNodeIds),
  };

  return {
    ok: !parseError || isSAML, // a recoverable parse note shouldn't blank the view if we still got a tree
    parseError,
    root,
    anatomy,
    nodeIdOf,
    roleOf,
    isSigned: (nodeId: string) => signedNodeIds.has(nodeId),
  };
}

function markSubtreeSigned(el: XmlNode, nodeIdOf: (e: XmlNode) => string | undefined, out: Set<string>) {
  const stack: XmlNode[] = [el];
  while (stack.length) {
    const n = stack.pop()!;
    if (isElement(n)) {
      const id = nodeIdOf(n);
      if (id) out.add(id);
    }
    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const c = kids.item(i);
      if (c) stack.push(c);
    }
  }
}

function cleanupParseMessage(msg: string): string {
  const stripped = msg.replace(/\s*@#\[line:\d+,col:\d+\]/g, '').replace(/^\[xmldom \w+\]\s*/i, '').trim();
  return stripped || 'The document is not well-formed XML. Check for an unclosed tag or a stray character.';
}

function extractLine(msg: string): number | undefined {
  const m = msg.match(/line:(\d+)/);
  return m ? Number(m[1]) : undefined;
}
