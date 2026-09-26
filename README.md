# samlsec

The offensive, educational counterpart to [samltool.com](https://www.samltool.com). Where samltool.com helps you
*integrate* SAML, samlsec helps you *understand, inspect, and test* it — for learning and authorized security testing.

Everything runs **client-side**. There is no backend and no tracking: the SAML you paste is decoded in your browser and
never leaves your machine.

Live at <https://inzelsec.github.io/samlsec/>.

## The tools

- **Decoder** — paste a SAMLResponse (Base64, Base64 + DEFLATE, URL-encoded, or raw XML); every step is auto-detected
  and undone, in order. Shows the anatomy with signature-coverage highlighting: covered assertions in green,
  uncovered ones in red, with a connector drawn from each `ds:Reference` to the element it protects. It does **not**
  cryptographically verify signatures (that needs the IdP's certificate) — it shows structural coverage, the property
  the attacks below exploit.
- **Encoder** — the reverse: raw XML in, both wire formats out (HTTP-POST and HTTP-Redirect), byte-for-byte, no
  reparsing.
- **Viewer** — a full-screen, byte-exact, syntax-highlighted XML viewer with a live, XPath-driven summary of the
  security-relevant fields (NameID, Issuer, Destination, Conditions, AudienceRestriction, AttributeStatement,
  SignatureMethod, DigestValue).
- **Attacks** — the SAML Raider-equivalent: generates XSW1–8, signature-exclusion, comment-injection, and
  namespace-forgery payloads from a legitimate response you provide, with the SP condition each one needs.

Differential and Learn are stubbed and being built out.

## Signature-preservation test suite

`tests/attack-signature-preservation.test.ts` is a computational proof, not a read-through: it genuinely signs a
fixture with a real key, runs every wrapping/exclusion attack module over it, and asks `xml-crypto` — an independent
XML-DSig implementation — whether the result still validates, and against which content.

```bash
npm test
```

## Tech

- [Next.js](https://nextjs.org) (App Router) with static export (`output: 'export'`) — pure static HTML/JS, no server.
- TypeScript, Tailwind CSS driven by CSS custom-property design tokens (light + dark themes).
- [Geist Sans / Geist Mono](https://vercel.com/font) via `next/font`.
- `@xmldom/xmldom` + `fast-xml-parser` for XML, `pako` for DEFLATE, `xpath` for structural field extraction.
- Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build (static export)

```bash
npm run build    # emits ./out — a static site
npm run serve    # serve ./out locally to verify the export
```

Locally this builds at the root path. In CI (`GITHUB_ACTIONS=true`), `next.config.js` applies `basePath`/`assetPrefix`
of `/samlsec` to match where GitHub Pages actually serves this project site.

## Layout

```
app/            routes: landing page (/), decoder/, encoder/, viewer/, attacks/, plus the reference
                pages + metadata, sitemap, robots
components/
  SAMLDecoder/  the decoder + encoder panels: input, XML view, connectors, coverage panel
  Viewer/       the standalone XML viewer + security-fields panel
  AttackGenerator/  the attack payload generator
  shell/        header, nav, footer, theme toggle
  ui/           button, badge, panel/instrument, copy button, code-xml primitives
lib/
  saml/         decode, encode, anatomy (parse -> SAMLAnatomy), render (tokenize), highlight (verbatim
                tokenizer), inspect (XPath field extraction), attacks/ (the payload generators), dom
                (shared DOM helpers)
  site.ts       central site metadata + nav
content/
  fixtures/     synthetic, fabricated sample SAMLResponses (see its README)
tests/          the signature-preservation test suite (node:test + xml-crypto)
```

## License

MIT © Alex Insel. See [LICENSE](./LICENSE). Please read the in-app **Responsible use** page before using the offensive
tools.
