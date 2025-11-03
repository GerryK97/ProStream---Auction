/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Specify the workspace root to avoid multiple lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: [],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
