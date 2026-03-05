'use client';

import { useEffect } from 'react';

export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Prefetch key routes after SW is active
          if (reg.active) {
            reg.active.postMessage({
              type: 'PREFETCH',
              urls: ['/agent/dashboard', '/agent/leads', '/admin/dashboard'],
            });
          }
        })
        .catch(() => {});
    }
  }, []);
  return null;
}
