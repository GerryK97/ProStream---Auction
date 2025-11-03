/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@google/genai'],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
