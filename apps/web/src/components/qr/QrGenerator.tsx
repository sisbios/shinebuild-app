'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@shinebuild/ui';
import { generateQrTokenAction } from '@/app/(agent)/agent/qr/actions';

const QR_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function QrGenerator() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const left = expiresAt - Date.now();
      if (left <= 0) {
        setQrUrl(null);
        setExpiresAt(null);
        clearInterval(interval);
      } else {
        setTimeLeft(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateQrTokenAction();
      if (result.error) { setError(result.error); return; }
      setQrUrl(result.qrUrl!);
      setExpiresAt(Date.now() + QR_TTL_MS);
      setTimeLeft(QR_TTL_MS);
    } catch {
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="space-y-5">
      {qrUrl ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
              <QRCodeSVG
                value={qrUrl}
                size={220}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Countdown */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-center">
            <p className="text-sm font-medium text-amber-800">
              Expires in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <p className="text-xs text-amber-600">Single-use · Show to customer to scan</p>
          </div>

          <Button variant="outline" size="full" onClick={generate} loading={loading}>
            Generate New QR
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">Generate a QR Code</p>
            <p className="text-sm text-gray-500 mt-1">
              Customer scans this and enters their own details securely
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button size="full" onClick={generate} loading={loading}>
            Generate QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
