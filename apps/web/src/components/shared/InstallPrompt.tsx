'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;
    if (sessionStorage.getItem('pwa-dismissed')) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIos(true);
      // Show iOS hint after 4s
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1');
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-50 md:left-auto md:right-5 md:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
        <div className="h-11 w-11 brand-gradient rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Install Shine Build Hub</p>
          {isIos ? (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Tap <strong>Share</strong> <span className="text-base">⎙</span> then <strong>"Add to Home Screen"</strong> for the full app experience.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 mt-0.5">Get the full native app experience</p>
              <div className="flex gap-2 mt-3">
                <button onClick={install} className="flex-1 brand-gradient text-white text-xs font-bold rounded-xl py-2 shadow-sm">
                  Install App
                </button>
                <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 px-3">
                  Later
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={dismiss} className="text-gray-300 hover:text-gray-500 flex-shrink-0 -mt-0.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
