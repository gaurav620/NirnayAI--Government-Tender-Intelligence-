/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverBodySizeLimit: '20mb',
  },
};

export default nextConfig;
