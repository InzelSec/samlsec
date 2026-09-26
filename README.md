# samlsec

The offensive, educational counterpart to [samltool.com](https://www.samltool.com). Where samltool.com helps you
*integrate* SAML, samlsec helps you *understand, inspect, and test* it — for learning and authorized security testing.

Everything runs **client-side**. There is no backend and no tracking: the SAML you paste is decoded in your browser and
never leaves your machine.

> **Status:** Phase 1 — foundation, design system, and the home page (the Visual Decoder). Other tools are stubbed and
> being built out.

## The decoder

Paste a SAMLResponse (Base64, Base64 + DEFLATE, or raw XML). samlsec:

- auto-detects the encoding and decodes it,
- pretty-prints the XML with anatomy-aware syntax highlighting,
- highlights the key elements (Assertion, Signature, Reference, DigestValue, SignatureValue, NameID, Conditions,
  Attributes),
- and — the point of the tool — shows **what a signature actually covers**: covered assertions in green, uncovered ones
  in red, with a connector drawn from each `ds:Reference` to the element it protects.

It does **not** cryptographically verify signatures (that would need the IdP's certificate and is not what the research
is about). It shows structural coverage — the property the attacks exploit.

## Tech

- [Next.js](https://nextjs.org) (App Router) with static export (`output: 'export'`) — pure static HTML/JS, no server.
- TypeScript, Tailwind CSS driven by CSS custom-property design tokens (light + dark themes).
- [Geist Sans / Geist Mono](https://vercel.com/font) via `next/font`.
- `@xmldom/xmldom` + `fast-xml-parser` for XML, `pako` for DEFLATE.

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

The contents of `out/` can be hosted on any static host (Vercel, GitHub Pages, object storage). Before deploying,
confirm the placeholders in `lib/site.ts` (domain, GitHub, social links).

## Layout

```
app/            routes (home = decoder; other tools stubbed) + metadata, sitemap, robots
components/
  SAMLDecoder/  the decoder: input, XML view, connectors, coverage panel
  shell/        header, nav, footer, theme toggle
  ui/           button, badge, panel/instrument primitives
lib/
  saml/         decode, anatomy (parse -> SAMLAnatomy), render (tokenize), algorithms
  site.ts       central site metadata + nav
content/
  fixtures/     synthetic, fabricated sample SAMLResponses (see its README)
```

## License

MIT © Alex Insel. See [LICENSE](./LICENSE). Please read the in-app **Responsible use** page before using the offensive
tools.
