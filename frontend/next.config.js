/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["via.placeholder.com", "api.nasa.gov", "earthdata.nasa.gov"],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_API_URL || "https://alphainsure-backend-production.up.railway.app"
      : "http://localhost:3002",
    NEXT_PUBLIC_AI_API_URL: process.env.NODE_ENV === 'production'
      ? process.env.NEXT_PUBLIC_AI_API_URL || "https://alphainsure-ai.onrender.com" 
      : "http://localhost:5000",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
