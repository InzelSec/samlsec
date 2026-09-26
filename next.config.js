/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export — no server, no API routes, no runtime.
  output: 'export',

  // Static hosts (GitHub Pages / plain object storage) serve /path/ as
  // /path/index.html, so emit trailing-slash directories.
  trailingSlash: true,

  // next/image optimization needs a server; disable for static export.
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
