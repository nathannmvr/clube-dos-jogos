import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'media.rawg.io' },
      { protocol: 'https', hostname: 'media.rawg.io', pathname: '/media/**' },
      { protocol: 'https', hostname: '**.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: '**.cloudflare-ipfs.com' },
      // Allow any https hostname for user-provided covers
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default config