// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['utfs.io', 'res.cloudinary.com', 'cloudinary.com'],
  },
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
