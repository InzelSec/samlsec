// GitHub Pages serves project sites (as opposed to a user/org root site) from
// a subpath — this repo publishes to inzelsec.github.io/samlsec, not to a
// domain root. `GITHUB_ACTIONS` is set to "true" automatically on every
// Actions runner and is never set locally, so this applies the subpath only
// to the build that actually gets deployed: `npm run dev` and a local
// `npm run build` stay at the root, exactly as before.
const isGithubActionsBuild = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGithubActionsBuild ? '/samlsec' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export — no server, no API routes, no runtime.
  output: 'export',

  // Static hosts (GitHub Pages / plain object storage) serve /path/ as
  // /path/index.html, so emit trailing-slash directories.
  trailingSlash: true,

  basePath,
  assetPrefix: basePath,

  // next/image optimization needs a server; disable for static export.
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
