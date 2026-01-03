import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@fortune-sheet/react'],
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
  },
};

export default nextConfig;
