/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["via.placeholder.com", "api.nasa.gov", "earthdata.nasa.gov"],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002",
    NEXT_PUBLIC_AI_API_URL:
      process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:5000",
  },
};

module.exports = nextConfig;
