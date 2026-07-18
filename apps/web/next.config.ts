import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Support outputting standalone container builds for Docker sizes if needed
  output: 'standalone',
};

export default nextConfig;
