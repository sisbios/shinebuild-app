'use client';

import { useEffect, useState } from 'react';
import { usePwaInstall } from './PwaInstallProvider';

const DISMISS_KEY = 'pwa-dismissed-until';
const DISMISS_DAYS = 7;

function isDismissed() {
  try {
    const until = localStorage.getItem(DISMISS_KEY);
    return until ? Date.now() < parseInt(until, 10) : false;
  } catch { return false; }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86400_000));
  } catch {}
}

export function InstallPrompt() {
  const { canInstall, isIos, promptInstall } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    if (isDismissed()) return;
    const t = setTimeout(() => setVisible(true), isIos ? 4000 : 3500);
    return () => clearTimeout(t);
  }, [canInstall, isIos]);

  const dismiss = () => {
    setDismissed();
    setVisible(false);
  };

  const install = async () => {
    await promptInstall();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80 animate-in slide-in-from-bottom-4 duration-300">
      <div className="glass-card rounded-2xl p-4 shadow-xl flex items-start gap-3">
        <img
          src="/icons/logo-96.png"
          alt="Shine Build Hub"
          className="h-11 w-11 rounded-xl object-cover flex-shrink-0 shadow-md"
        />
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
