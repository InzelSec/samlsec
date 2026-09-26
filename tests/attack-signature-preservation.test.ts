/**
 * Computational proof, not code review: this signs a real assertion/response
 * with a real key, runs every attack module over it, and asks an independent
 * XML-DSig implementation (xml-crypto — not this project's own code) whether
 * the result still cryptographically validates and, if so, against which
 * content. Reading `lib/saml/attacks/modules.ts` says the engine clones the
 * signed node before mutating anything; this test is what turns that claim
 * into a verified fact instead of a careful guess.
 *
 * Run with `npm test`.
 */
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { DOMParser } from '@xmldom/xmldom';
import { SignedXml } from 'xml-crypto';
// xpath ships its own types but no ESM default export typing quirks worth fighting;
// this mirrors xml-crypto's own README example verbatim.
import * as xpath from 'xpath';

import { ATTACKS, getAttack } from '../lib/saml/attacks/modules';
import { elementsByLocal, parseDoc } from '../lib/saml/dom';

const LEGIT_NAME_ID = 'legit-user@example.com';
const ATTACKER_NAME_ID = 'attacker@evil.example';

const SIGNATURE_ALGORITHM = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
const CANONICALIZATION = 'http://www.w3.org/2001/10/xml-exc-c14n#';
const DIGEST_ALGORITHM = 'http://www.w3.org/2001/04/xmlenc#sha256';
const ENVELOPED = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';

const DUPLICATE_ID_ERROR =
  'Cannot validate a document which contains multiple elements with the same value for the ID / Id / Id attributes';

let publicKey: string;
let privateKey: string;

before(() => {
  // A fresh, throwaway 2048-bit RSA key — generated once per test run, never
  // written to disk, never reused outside this process.
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  publicKey = pair.publicKey;
  privateKey = pair.privateKey;
});

/** Enveloped-signs the element `targetXPath` selects (it must already carry `ID="refId"`). */
function signEnveloped(xml: string, targetXPath: string, refId: string): string {
  const sig = new SignedXml({
    privateKey,
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    canonicalizationAlgorithm: CANONICALIZATION,
  });
  sig.addReference({
    xpath: targetXPath,
    uri: `#${refId}`,
    digestAlgorithm: DIGEST_ALGORITHM,
    transforms: [ENVELOPED, CANONICALIZATION],
  });
  sig.computeSignature(xml, { location: { reference: targetXPath, action: 'append' } });
  return sig.getSignedXml();
}

/** A signed Assertion inside an otherwise-plain Response — what XSW3–8 and signature-exclusion target. */
function assertionSignedFixture(): { xml: string; assertionId: string } {
  const assertionId = '_assertion_fixture_1';
  const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_response_fixture_1" Version="2.0" IssueInstant="2026-01-01T00:00:00Z" Destination="https://sp.example.com/acs">
  <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
  <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
  <saml:Assertion ID="${assertionId}" Version="2.0" IssueInstant="2026-01-01T00:00:00Z">
    <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${LEGIT_NAME_ID}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"/>
    </saml:Subject>
    <saml:Conditions NotBefore="2026-01-01T00:00:00Z" NotOnOrAfter="2026-01-01T01:00:00Z"/>
  </saml:Assertion>
</samlp:Response>`;
  return { xml: signEnveloped(xml, "//*[local-name(.)='Assertion']", assertionId), assertionId };
}

/** A signed Response wrapping an unsigned Assertion — what XSW1/XSW2 target. */
function responseSignedFixture(): { xml: string; responseId: string } {
  const responseId = '_response_fixture_2';
  const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${responseId}" Version="2.0" IssueInstant="2026-01-01T00:00:00Z" Destination="https://sp.example.com/acs">
  <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
  <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
  <saml:Assertion ID="_assertion_fixture_2" Version="2.0" IssueInstant="2026-01-01T00:00:00Z">
    <saml:Issuer>https://idp.example.com/metadata</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${LEGIT_NAME_ID}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"/>
    </saml:Subject>
  </saml:Assertion>
</samlp:Response>`;
  return { xml: signEnveloped(xml, "//*[local-name(.)='Response']", responseId), responseId };
}

function findSignatureNode(doc: Node) {
  return xpath.select1(
    "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']",
    doc,
  );
}

type VerifyOutcome =
  | { kind: 'valid'; signedContent: string[] }
  | { kind: 'invalid' }
  | { kind: 'no-signature' }
  | { kind: 'rejected-duplicate-id'; message: string }
  | { kind: 'threw'; message: string };

/**
 * An independent check: parse `xml` fresh, hand the Signature to xml-crypto — a
 * different implementation than this project's own — and ask it to verify.
 * `getSignedReferences()` (only populated after a real pass) is what xml-crypto's
 * own docs say is safe to trust; that is what gets inspected below, never a node
 * pulled from the untrusted `doc` directly.
 */
function verify(xml: string): VerifyOutcome {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const signatureNode = findSignatureNode(doc);
  if (!signatureNode) return { kind: 'no-signature' };
  const sig = new SignedXml({ publicCert: publicKey });
  sig.loadSignature(signatureNode as unknown as Node);
  try {
    const valid = sig.checkSignature(xml);
    return valid ? { kind: 'valid', signedContent: sig.getSignedReferences() } : { kind: 'invalid' };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('multiple elements with the same value')) {
      return { kind: 'rejected-duplicate-id', message };
    }
    return { kind: 'threw', message };
  }
}

function generateOrThrow(id: string, sourceXml: string) {
  const attack = getAttack(id);
  assert.ok(attack, `attack module "${id}" is registered`);
  const result = attack!.generate(sourceXml, { nameId: ATTACKER_NAME_ID, commentTail: '.attacker.example' });
  assert.equal(result.ok, true, `${id} should generate successfully; got error: ${result.error}`);
  return result.maliciousXML;
}

describe('signature exclusion', () => {
  test('strips the signature entirely and injects the forged identity', () => {
    const { xml } = assertionSignedFixture();
    const output = generateOrThrow('sig-exclusion', xml);
    const { root } = parseDoc(output);
    assert.ok(root, 'output parses as XML');
    assert.equal(elementsByLocal(root, 'Signature').length, 0, 'no <ds:Signature> survives');
    assert.match(output, new RegExp(ATTACKER_NAME_ID), 'the forged NameID is present');
    assert.doesNotMatch(output, new RegExp(LEGIT_NAME_ID), 'the legitimate NameID is gone (it was overwritten, not preserved)');
  });
});

describe('XSW1 / XSW2 — Response-level signature', () => {
  for (const id of ['xsw1', 'xsw2']) {
    test(`${id}: the real signature still validates against the untouched clean copy`, () => {
      const { xml } = responseSignedFixture();
      const output = generateOrThrow(id, xml);

      // The forged identity must actually be present for a vulnerable SP to read.
      assert.match(output, new RegExp(ATTACKER_NAME_ID), 'forged NameID present in the document');

      const outcome = verify(output);
      assert.equal(outcome.kind, 'valid', `expected a valid signature, got ${outcome.kind}${'message' in outcome ? `: ${outcome.message}` : ''}`);
      if (outcome.kind === 'valid') {
        const verified = outcome.signedContent.join('\n');
        assert.match(verified, new RegExp(LEGIT_NAME_ID), 'the cryptographically verified content is the ORIGINAL, unmutated one');
        assert.doesNotMatch(verified, new RegExp(ATTACKER_NAME_ID), 'the forged identity must NOT be inside what the signature actually covers');
      }
    });
  }
});

describe('XSW3–6 — Assertion-level signature, no duplicate IDs', () => {
  for (const id of ['xsw3', 'xsw4', 'xsw5', 'xsw6']) {
    test(`${id}: the real signature still validates against the untouched clean copy`, () => {
      const { xml } = assertionSignedFixture();
      const output = generateOrThrow(id, xml);

      assert.match(output, new RegExp(ATTACKER_NAME_ID), 'forged NameID present in the document');

      const outcome = verify(output);
      assert.equal(outcome.kind, 'valid', `expected a valid signature, got ${outcome.kind}${'message' in outcome ? `: ${outcome.message}` : ''}`);
      if (outcome.kind === 'valid') {
        const verified = outcome.signedContent.join('\n');
        assert.match(verified, new RegExp(LEGIT_NAME_ID), 'the cryptographically verified content is the ORIGINAL, unmutated one');
        assert.doesNotMatch(verified, new RegExp(ATTACKER_NAME_ID), 'the forged identity must NOT be inside what the signature actually covers');
      }
    });
  }
});

describe('XSW7 / XSW8 — duplicate-ID variants', () => {
  // These two deliberately give two elements the same ID (that IS the attack).
  // A hardened verifier that checks for that ambiguity — which is exactly what
  // xml-crypto does — must refuse to pick one and validate, rather than being
  // fooled by it. That refusal is success for this test, not a failure: it
  // proves the variant's documented condition ("needs a permissive/non-duplicate
  // -checking verifier") is real and independently confirmable, not just asserted.
  for (const id of ['xsw7', 'xsw8']) {
    test(`${id}: a duplicate-ID-aware verifier refuses to validate rather than being fooled`, () => {
      const { xml } = assertionSignedFixture();
      const output = generateOrThrow(id, xml);

      const { root } = parseDoc(output);
      assert.ok(root, 'output parses as XML');
      const ids = elementsByLocal(root, 'Assertion')
        .map((a) => a.getAttribute?.('ID'))
        .filter(Boolean);
      assert.equal(new Set(ids).size < ids.length, true, `${id} is expected to produce a duplicate ID — that is the technique`);

      const outcome = verify(output);
      assert.equal(
        outcome.kind,
        'rejected-duplicate-id',
        `expected xml-crypto to refuse the duplicate-ID document, got ${outcome.kind}${'message' in outcome ? `: ${outcome.message}` : ''}`,
      );
    });
  }
});

test('every wrapping/exclusion attack module is covered by this file', () => {
  const covered = new Set(['sig-exclusion', 'xsw1', 'xsw2', 'xsw3', 'xsw4', 'xsw5', 'xsw6', 'xsw7', 'xsw8']);
  const relevant = ATTACKS.filter((a) => a.category === 'wrapping' || a.category === 'exclusion');
  for (const a of relevant) {
    assert.ok(covered.has(a.id), `"${a.id}" (${a.category}) has no signature-preservation test — add one above`);
  }
});
