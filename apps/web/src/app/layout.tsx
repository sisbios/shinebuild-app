import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@shinebuild/ui';
import { PwaInstallProvider } from '@/components/shared/PwaInstallProvider';
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
  themeColor: '#bf0000',
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
        {/* Capture beforeinstallprompt ASAP — before React hydrates — so it is
            never missed due to the event firing before useEffect attaches */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt',function(e){
            e.preventDefault();
            window.__pwaPrompt=e;
          });
        `}} />
      </head>
      <body className="bg-mesh font-sans antialiased min-h-svh overscroll-none">
        <ToastProvider>
          <PwaInstallProvider>
            {children}
            <InstallPrompt />
            <SwRegister />
          </PwaInstallProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
