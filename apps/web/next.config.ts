import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for npm workspaces to include package symlinks
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'shinebuild.sisbios.cloud',
      ],
    },
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.google.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
              "font-src 'self'",
              "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com wss://*.firebaseio.com",
              "frame-src https://www.google.com https://accounts.google.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
