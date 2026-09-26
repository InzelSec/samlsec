# Fixtures

Every SAML document in this directory is **synthetic and fabricated**. There is:

- no real personal data (names, emails, and domains are all `example.com` placeholders),
- no real certificate (the `X509Certificate` blocks are obvious placeholder strings, not keys),
- no valid signature (every `DigestValue` / `SignatureValue` is a dummy Base64 placeholder, not a computed signature).

They exist so the tools have something to load and demonstrate on: the decoder's
pre-loaded example, the (future) attack generator's input, and teaching cases
such as signature wrapping and comment injection.

Because the signatures are not real, the decoder never claims a document is
"verified" — it only shows you *what a signature covers structurally*, which is
the property the attacks exploit. Verifying a real signature is out of scope for
a client-side tool (it would need the IdP's certificate and is not what the
research is about).
