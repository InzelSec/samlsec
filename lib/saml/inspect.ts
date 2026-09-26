// Structural extraction for the Viewer's "Security fields" panel. Every field
// is pulled by XPath over the parsed DOM — never a regex over the source text
// — so nesting, namespaces, and attribute-vs-element shape are all respected
// exactly as a real XML processor sees them. `local-name()` is used
// throughout (matching the convention in dom.ts/attacks) so this works
// whatever namespace prefix a given IdP happens to use.
import * as xpath from 'xpath';
import { parseDoc, type El } from './dom';

export interface NameIdField {
  value: string;
  format: string | null;
}

export interface AttributeField {
  name: string;
  friendlyName: string | null;
  values: string[];
}

export interface InspectSummary {
  nameIds: NameIdField[];
  issuers: string[];
  destination: string | null;
  conditions: { notBefore: string | null; notOnOrAfter: string | null } | null;
  audiences: string[];
  attributes: AttributeField[];
  signatureMethods: string[];
  digestValues: string[];
}

export interface InspectResult {
  ok: boolean;
  summary: InspectSummary | null;
  error?: string;
}

function text(node: El): string {
  return String(node?.textContent ?? node?.nodeValue ?? '').trim();
}

function attr(node: El, name: string): string | null {
  if (!node?.getAttribute) return null;
  const v = node.getAttribute(name);
  return v === '' || v == null ? null : v;
}

/** select() typed loosely on purpose — see dom.ts's own note on xmldom vs lib.dom friction. */
function query(context: El, expression: string): El[] {
  const result = xpath.select(expression, context);
  return Array.isArray(result) ? result : result == null ? [] : [result];
}

export function inspect(xml: string): InspectResult {
  const { doc, root, error } = parseDoc(xml);
  if (!doc || !root) {
    return { ok: false, summary: null, error: error || 'Could not parse this as XML.' };
  }

  const nameIds: NameIdField[] = query(doc, "//*[local-name()='NameID']").map((n) => ({
    value: text(n),
    format: attr(n, 'Format'),
  }));

  const issuers = query(doc, "//*[local-name()='Issuer']").map(text).filter(Boolean);

  const destinationAttr = query(doc, '//@Destination')[0];
  const destination = destinationAttr ? String(destinationAttr.value ?? destinationAttr.nodeValue ?? '') || null : null;

  const conditionsNode = query(doc, "//*[local-name()='Conditions']")[0];
  const conditions = conditionsNode
    ? { notBefore: attr(conditionsNode, 'NotBefore'), notOnOrAfter: attr(conditionsNode, 'NotOnOrAfter') }
    : null;

  const audiences = query(doc, "//*[local-name()='Audience']").map(text).filter(Boolean);

  const attributes: AttributeField[] = query(doc, "//*[local-name()='Attribute']").map((a) => ({
    name: attr(a, 'Name') || '(unnamed)',
    friendlyName: attr(a, 'FriendlyName'),
    // Relative query against `a` as the context node — every AttributeValue nested under this specific Attribute.
    values: query(a, ".//*[local-name()='AttributeValue']").map(text),
  }));

  const signatureMethods = query(doc, "//*[local-name()='SignatureMethod']")
    .map((n) => attr(n, 'Algorithm'))
    .filter((v): v is string => Boolean(v));

  const digestValues = query(doc, "//*[local-name()='DigestValue']").map(text).filter(Boolean);

  return {
    ok: true,
    summary: { nameIds, issuers, destination, conditions, audiences, attributes, signatureMethods, digestValues },
  };
}
