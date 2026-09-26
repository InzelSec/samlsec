import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

// The attack engine needs a full mutable DOM (create/clone/move/serialize),
// which is more than the read-only shape used by the decoder. xmldom's runtime
// objects implement the standard DOM methods; we type them loosely here to avoid
// friction between xmldom's declarations and lib.dom.
/* eslint-disable @typescript-eslint/no-explicit-any */
export type El = any;
export type Doc = any;

export const NS = {
  assertion: 'urn:oasis:names:tc:SAML:2.0:assertion',
  protocol: 'urn:oasis:names:tc:SAML:2.0:protocol',
  dsig: 'http://www.w3.org/2000/09/xmldsig#',
};

export interface ParseOutcome {
  doc: Doc | null;
  root: El | null;
  error: string | null;
}

export function parseDoc(xml: string): ParseOutcome {
  const errors: string[] = [];
  let doc: Doc | null = null;
  try {
    const parser = new DOMParser({
      onError: (level: string, message: string) => {
        if (level === 'error' || level === 'fatalError') errors.push(message);
      },
    } as any);
    doc = parser.parseFromString(xml, 'text/xml');
  } catch (e) {
    return { doc: null, root: null, error: e instanceof Error ? e.message : 'Could not parse XML.' };
  }
  let root: El | null = null;
  const kids = doc.childNodes;
  for (let i = 0; i < kids.length; i++) {
    const c = kids.item(i);
    if (c && c.nodeType === 1) {
      root = c;
      break;
    }
  }
  if (!root) return { doc, root: null, error: errors[0] || 'No XML element found.' };
  return { doc, root, error: errors[0] || null };
}

export function serialize(node: El): string {
  return new XMLSerializer().serializeToString(node);
}

export function localName(n: El): string {
  return String(n.localName || n.nodeName || '').replace(/^.*:/, '');
}

export function elementsByLocal(root: El, name: string): El[] {
  const out: El[] = [];
  const walk = (n: El) => {
    if (n.nodeType === 1 && localName(n) === name) out.push(n);
    const kids = n.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const c = kids.item(i);
      if (c) walk(c);
    }
  };
  walk(root);
  return out;
}

export function firstByLocal(root: El, name: string): El | null {
  return elementsByLocal(root, name)[0] || null;
}

/** The indentation whitespace text node that precedes `ref`, if any (for tidy inserts). */
function leadingWhitespace(ref: El): string {
  const prev = ref.previousSibling;
  if (prev && prev.nodeType === 3 && !String(prev.nodeValue || '').trim()) {
    const v = String(prev.nodeValue || '');
    const nl = v.lastIndexOf('\n');
    return nl >= 0 ? v.slice(nl) : v;
  }
  return '\n';
}

/** Insert `node` as a sibling before `ref`, matching its indentation. */
export function insertBeforeSibling(node: El, ref: El): void {
  const doc = ref.ownerDocument;
  const ws = leadingWhitespace(ref);
  ref.parentNode.insertBefore(node, ref);
  ref.parentNode.insertBefore(doc.createTextNode(ws), ref);
}

/** Insert `node` as a sibling after `ref`, matching its indentation. */
export function insertAfterSibling(node: El, ref: El): void {
  const doc = ref.ownerDocument;
  const ws = leadingWhitespace(ref);
  const next = ref.nextSibling;
  ref.parentNode.insertBefore(doc.createTextNode(ws), next);
  ref.parentNode.insertBefore(node, next);
}

export function removeNode(n: El): void {
  if (n && n.parentNode) n.parentNode.removeChild(n);
}

/** Replace a NameID's content with a single text value. */
export function setText(el: El, value: string): void {
  while (el.firstChild) el.removeChild(el.firstChild);
  el.appendChild(el.ownerDocument.createTextNode(value));
}

/** A fresh, obviously-synthetic id. */
export function newId(prefix = '_forged'): string {
  const rnd = (globalThis.crypto?.getRandomValues?.(new Uint8Array(8)) ?? null);
  const hex = rnd
    ? Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('')
    : Math.random().toString(16).slice(2, 18);
  return `${prefix}_${hex}`;
}

/** Set an attribute named exactly `name` (case-sensitive; SAML uses "ID"). */
export function setAttr(el: El, name: string, value: string): void {
  el.setAttribute(name, value);
}

export function getAttr(el: El, name: string): string | null {
  return el.getAttribute ? el.getAttribute(name) : null;
}
