'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallContextValue {
  /** true whenever the app is NOT running as a standalone PWA */
  canInstall: boolean;
  /** true if the browser has a native install prompt ready (Android/Chrome) */
  hasNativePrompt: boolean;
  isIos: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  hasNativePrompt: false,
  isIos: false,
  isInstalled: false,
  promptInstall: async () => {},
});

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIos(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setIsInstalled(true);
  };

  // Always show the install button when not running as a standalone PWA.
  // Even without a native prompt (Android cooldown after reinstall) we show
  // manual instructions so the user can still install.
  const canInstall = !isInstalled;
  const hasNativePrompt = !!deferredPrompt;

  return (
    <PwaInstallContext.Provider value={{ canInstall, hasNativePrompt, isIos, isInstalled, promptInstall }}>
      {children}
    </PwaInstallContext.Provider>
  );
}
