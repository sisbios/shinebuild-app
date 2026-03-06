'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { GeoCapture, type GeoData } from '@/components/shared/GeoCapture';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import {
  generateQrForNewLead,
  checkLeadFromToken,
  completeAgentLeadDetails,
} from './actions';

interface Props {
  agentId: string;
  serviceItems: Array<{ id: string; name: string }>;
}

const QR_TTL_MS = 15 * 60 * 1000;

export function NewLeadFlow({ agentId, serviceItems }: Props) {
  const router = useRouter();

  // Step 1 – QR
  const [step, setStep] = useState<'qr' | 'details'>('qr');
  const [qrUrl, setQrUrl] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 2 – Agent details
  const [leadId, setLeadId] = useState('');
  const [geo, setGeo] = useState<GeoData | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [agentNotes, setAgentNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate on mount
  useEffect(() => { generateQr(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const iv = setInterval(() => {
      const left = expiresAt - Date.now();
      if (left <= 0) { setQrUrl(''); setTimeLeft(0); clearInterval(iv); }
      else setTimeLeft(left);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  // Poll for customer submission
  useEffect(() => {
    if (!tokenId || step !== 'qr') return;
    pollRef.current = setInterval(async () => {
      const res = await checkLeadFromToken(tokenId);
      if (res.leadId) {
        clearInterval(pollRef.current!);
        setLeadId(res.leadId);
        setStep('details');
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tokenId, step]);

  const generateQr = async () => {
    setQrLoading(true);
    setQrError('');
    try {
      const res = await generateQrForNewLead();
      if ('error' in res && res.error) { setQrError(res.error); return; }
      setQrUrl((res as any).qrUrl);
      setTokenId((res as any).tokenId);
      setExpiresAt(Date.now() + QR_TTL_MS);
      setTimeLeft(QR_TTL_MS);
    } catch { setQrError('Failed to generate QR. Please try again.'); }
    finally { setQrLoading(false); }
  };

  const toggleService = (name: string) =>
    setServices((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!geo) errs['geo'] = 'Location capture is required';
    if (photos.length === 0) errs['photos'] = 'At least 1 photo is required';
    if (services.length === 0 && serviceItems.length > 0) errs['services'] = 'Select at least one service';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await completeAgentLeadDetails(leadId, { geo: geo!, photos, services, agentNotes });
      if (res.error) { setErrors({ submit: res.error }); return; }
      router.push(`/agent/leads/${leadId}`);
    } catch { setErrors({ submit: 'Failed to submit. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  /* ── Step 1: QR ────────────────────────────────────────── */
  if (step === 'qr') {
    return (
      <div className="space-y-5">
        {qrUrl ? (
          <div className="space-y-4">
            {/* QR card */}
            <div className="glass-card rounded-2xl p-5 flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
                <QRCodeSVG value={qrUrl} size={210} level="M" includeMargin={false} />
              </div>

              {/* Countdown */}
              <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-center">
                <p className="text-sm font-semibold text-amber-800">
                  Expires in {minutes}:{seconds.toString().padStart(2, '0')}
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Single-use · Show to customer to scan</p>
              </div>

              {/* Waiting indicator */}
              <div className="w-full rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Waiting for customer…</p>
                  <p className="text-xs text-blue-600">App will continue automatically once they submit</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="glass-card rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">How it works</p>
              <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
                <li>Show this QR code to the customer</li>
                <li>Customer scans with their phone camera</li>
                <li>They enter their name, phone &amp; requirement</li>
                <li>You'll be taken to the next step automatically</li>
              </ol>
            </div>

            <button
              onClick={generateQr}
              disabled={qrLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 hover:border-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {qrLoading ? 'Generating…' : 'Generate New QR'}
            </button>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Generating QR Code…</p>
              <p className="text-sm text-gray-500 mt-1">Please wait</p>
            </div>
            {qrError && <p className="text-sm text-red-600">{qrError}</p>}
            {!qrLoading && (
              <button
                onClick={generateQr}
                className="rounded-xl brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Step 2: Agent details ─────────────────────────────── */
  return (
    <div className="space-y-5">
      {/* Customer filled notice */}
      <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
        <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-green-800">Customer details received</p>
          <p className="text-xs text-green-600">Now add your site observations below</p>
        </div>
      </div>

      {/* Services checklist */}
      {serviceItems.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Services Required <span className="text-red-500">*</span>
          </label>
          <div className="glass-card rounded-2xl p-4 grid grid-cols-2 gap-2">
            {serviceItems.map((item) => {
              const checked = services.includes(item.name);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleService(item.name)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    checked
                      ? 'bg-red-50 border border-red-300 text-red-800'
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  <div className={`flex-shrink-0 h-4 w-4 rounded border ${checked ? 'bg-red-600 border-red-600' : 'border-gray-300'} flex items-center justify-center`}>
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="leading-tight">{item.name}</span>
                </button>
              );
            })}
          </div>
          {errors['services'] && <p className="text-xs text-red-600">{errors['services']}</p>}
        </div>
      )}

      {/* Geo */}
      <GeoCapture onCapture={setGeo} value={geo} error={errors['geo']} />

      {/* Photos */}
      <PhotoUpload
        agentId={agentId}
        leadDraftId={leadId}
        onUpload={setPhotos}
        value={photos}
        error={errors['photos']}
      />

      {/* Agent notes */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Site Observations</label>
        <textarea
          className="flex min-h-[90px] w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-red-700 focus:outline-none focus:ring-1 focus:ring-red-700"
          placeholder="Additional notes about the site, property condition, urgency, etc."
          value={agentNotes}
          onChange={(e) => setAgentNotes(e.target.value)}
        />
      </div>

      {errors['submit'] && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{errors['submit']}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-60 transition-opacity"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </>
        ) : 'Submit Lead'}
      </button>
    </div>
  );
}
