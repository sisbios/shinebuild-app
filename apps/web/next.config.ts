import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for npm workspaces to include package symlinks
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  // Transpile workspace packages so webpack processes their TypeScript source
  transpilePackages: ['@shinebuild/shared', '@shinebuild/ui', '@shinebuild/firebase'],
  webpack: (config: any, { isServer, webpack: wp }: { isServer: boolean; webpack: any }) => {
    // Allow .js extensions in TypeScript ESM imports to resolve to .ts/.tsx files
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    // Strip node: prefix so webpack can resolve built-ins normally.
    // This runs before scheme resolution, unlike resolve.alias.
    config.plugins.push(
      new wp.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );
    if (!isServer) {
      // Server-only node built-ins → empty modules on client (never called from browser)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        path: false,
        buffer: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
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
              "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com wss://*.firebaseio.com https://www.google.com https://recaptcha.google.com https://www.recaptcha.net",
              "frame-src https://www.google.com https://accounts.google.com https://recaptcha.google.com https://www.recaptcha.net",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
