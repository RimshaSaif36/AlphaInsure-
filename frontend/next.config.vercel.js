/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["via.placeholder.com", "api.nasa.gov", "earthdata.nasa.gov"],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://alphainsure-backend.railway.app",
    NEXT_PUBLIC_AI_API_URL:
      process.env.NEXT_PUBLIC_AI_API_URL || "https://alphainsure-ai.render.com",
  },
  // Optimizations for Vercel
  experimental: {
    optimizeCss: true,
  },
  swcMinify: true,
};

module.exports = nextConfig;