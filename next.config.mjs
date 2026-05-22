import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone build = self-contained .next/standalone folder, much smaller Docker image
  output: 'standalone',
  // Compress responses with gzip at the Next.js layer (Nginx also does this; redundant but cheap)
  compress: true,
  // Hide x-powered-by header
  poweredByHeader: false,
  // Production source maps off (smaller bundles)
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.balibestholiday.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
    // Cache optimized images on disk for 30 days (default is 60s — too short)
    minimumCacheTTL: 2592000,
    // AVIF + WebP for ~30% smaller images vs JPEG
    formats: ['image/avif', 'image/webp'],
    // Limit device sizes — default has too many breakpoints
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
    // Optimize lucide-react icon imports (only imports the icons used, not the full library)
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default withNextIntl(nextConfig);
