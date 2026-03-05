import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@shinebuild/ui';
import { InstallPrompt } from '@/components/shared/InstallPrompt';
import { SwRegister } from '@/components/shared/SwRegister';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Shine Build Hub',
  description: 'Secure lead collection and agent incentive platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShineBuild',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-mesh font-sans antialiased min-h-svh overscroll-none">
        <ToastProvider>
          {children}
          <InstallPrompt />
          <SwRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
