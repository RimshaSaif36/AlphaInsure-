/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    domains: ["via.placeholder.com", "api.nasa.gov", "earthdata.nasa.gov"],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
    NEXT_PUBLIC_AI_API_URL:
      process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:5000",
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/AlphaInsure-' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/AlphaInsure-' : '',
};

module.exports = nextConfig;
