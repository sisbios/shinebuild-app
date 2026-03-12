'use client';

import { useState } from 'react';
import { usePwaInstall } from './PwaInstallProvider';

export function PwaInstallButton() {
  const { canInstall, isIos, promptInstall } = usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (isIos) {
      setShowIosHint(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install App"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 text-gray-500 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
      >
        {/* Download-to-device icon */}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {/* iOS install instructions overlay */}
      {showIosHint && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowIosHint(false)}
        >
          <div
            className="glass-card rounded-2xl p-5 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <img src="/icons/logo-96.png" alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Install Shine Build Hub</p>
                <p className="text-xs text-gray-500">Add to your home screen</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tap the <strong>Share</strong> button <span className="text-base">⎙</span> at the bottom of your browser,
              then tap <strong>"Add to Home Screen"</strong>.
            </p>
            <button
              onClick={() => setShowIosHint(false)}
              className="mt-4 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
