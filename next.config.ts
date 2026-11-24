import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // P0 fix #7 — also allow www.pexels.com since the demo HTML uses Pexels
      // stock images. Remove this in production when real Cloudinary assets replace them.
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
    // P0 fix #7 — REMOVED `unoptimized: true`.
    // That flag was disabling ALL next/image optimization:
    //   - No responsive srcset generation
    //   - No WebP/AVIF conversion
    //   - No LQIP placeholder="blur" support
    //   - No lazy-loading optimization
    // Major performance regression for an image-heavy luxury site.
    // Now next/image will optimize on the fly through Vercel's image optimizer.
  },
};

export default nextConfig;
