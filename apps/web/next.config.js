const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Note: Next.js 16 decoupled linting from `next build`; linting now runs via
  // the standalone `eslint .` script against the flat eslint.config.mjs.
  async headers() {
    return [
      {
        // Hardening headers for every route and asset. The CSP is pragmatic
        // for a Next.js app (inline hydration scripts require 'unsafe-inline');
        // frame-ancestors/base-uri/form-action still block clickjacking and
        // most injection-based exfiltration.
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=(self)',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
  webpack(config) {
    config.module.rules.unshift({
      test: /\.[cm]?[jt]sx?$/,
      include: path.resolve(__dirname, 'src'),
      enforce: 'pre',
      use: [
        {
          loader: path.resolve(__dirname, 'scripts/navemora-brand-loader.cjs'),
        },
      ],
    });
    return config;
  },
};

module.exports = nextConfig;
