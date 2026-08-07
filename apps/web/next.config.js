const path = require('node:path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
