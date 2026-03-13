/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Specify the workspace root to avoid multiple lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
  // Do NOT bundle pdfkit — it needs access to its font data files on disk at runtime.
  // When bundled by webpack, Next.js copies only the JS but not the /data/*.afm font files,
  // causing ENOENT errors when PDFKit tries to load Helvetica.afm.
  serverExternalPackages: ['pdfkit'],
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
