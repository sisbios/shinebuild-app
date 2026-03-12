'use client';

import { useState } from 'react';
import { usePwaInstall } from './PwaInstallProvider';

type HintType = 'ios' | 'android-manual' | null;

export function PwaInstallButton() {
  const { canInstall, hasNativePrompt, isIos, promptInstall } = usePwaInstall();
  const [hint, setHint] = useState<HintType>(null);

  if (!canInstall) return null;

  const handleClick = async () => {
    if (hasNativePrompt) {
      await promptInstall();
      return;
    }
    if (isIos) {
      setHint('ios');
      return;
    }
    // Android after reinstall (no native prompt yet) — show manual instructions
    setHint('android-manual');
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install App"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 text-gray-500 hover:bg-red-50 hover:text-red-700 transition-all active:scale-95"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </button>

      {hint && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setHint(null)}
        >
          <div
            className="glass-card rounded-2xl p-5 w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src="/icons/logo-96.png" alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm flex-shrink-0" />
              <div>
                <p className="font-bold text-gray-900 text-sm">Install Shine Build Hub</p>
                <p className="text-xs text-gray-500">Add to your home screen</p>
              </div>
            </div>

            {hint === 'ios' ? (
              <ol className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">1</span>
                  Tap the <strong>Share</strong> button <span className="text-base mx-0.5">⎙</span> at the bottom of Safari
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">2</span>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">3</span>
                  Tap <strong>"Add"</strong> in the top-right corner
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">1</span>
                  Tap the <strong>⋮ menu</strong> (three dots) in the top-right of Chrome
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">2</span>
                  Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold mt-0.5">3</span>
                  Tap <strong>"Install"</strong> to confirm
                </li>
              </ol>
            )}

            <button
              onClick={() => setHint(null)}
              className="mt-5 w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
