/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support outputting standalone container builds for Docker sizes if needed
  output: 'standalone',
};

export default nextConfig;
