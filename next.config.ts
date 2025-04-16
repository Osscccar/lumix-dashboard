/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This will completely skip ESLint during builds
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;