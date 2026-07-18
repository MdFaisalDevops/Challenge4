/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 'standalone' output is for Docker/self-hosted deployments only.
  // Vercel manages its own serverless output — do NOT set output here.
};

export default nextConfig;
