/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Specify the workspace root to avoid multiple lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
  // Do NOT bundle pdfkit — it needs access to its font data files on disk at runtime.
  // When bundled by webpack, Next.js copies only the JS but not the /data/*.afm font files,
  // causing ENOENT errors when PDFKit tries to load Helvetica.afm.
  serverExternalPackages: ['pdfkit', 'expo-server-sdk'],
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
