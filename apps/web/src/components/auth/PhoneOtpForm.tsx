'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client';
import { Button } from '@shinebuild/ui';
import { OtpInput } from '@shinebuild/ui';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { toE164 } from '@shinebuild/shared';

interface Props {
  onSuccess: (uid: string, idToken: string) => Promise<void>;
  submitLabel?: string;
  initialPhone?: string; // when provided, skip phone entry and auto-send OTP
}

export function PhoneOtpForm({ onSuccess, submitLabel = 'Verify & Continue', initialPhone }: Props) {
  const [phone, setPhone] = useState(initialPhone ?? '+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Pre-warm reCAPTCHA on mount so it's ready when user taps Send OTP
  useEffect(() => {
    try {
      const auth = getClientAuth();
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
      recaptchaRef.current = verifier;
      verifier.render().catch(() => {}); // pre-render silently
    } catch { /* ignore — will retry on sendOtp */ }
  }, []);

  // Auto-send OTP when phone is pre-filled (customer already entered it in a prior step)
  useEffect(() => {
    if (initialPhone && initialPhone.length >= 13) {
      // Small delay so reCAPTCHA pre-warm has a chance to complete
      const t = setTimeout(() => sendOtp(), 300);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getRecaptchaVerifier = (): RecaptchaVerifier => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const auth = getClientAuth();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
    recaptchaRef.current = verifier;
    return verifier;
  };

  const sendOtp = async () => {
    setError('');
    const e164 = toE164(phone);
    if (!e164) {
      setError('Enter a valid Indian mobile number');
      return;
    }
    setLoading(true);
    try {
      const auth = getClientAuth();
      const verifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, e164, verifier);
      confirmationRef.current = confirmation;
      setStep('otp');
    } catch (err: any) {
      setError(err.message ?? 'Failed to send OTP. Try again.');
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await confirmationRef.current!.confirm(otp);
      const idToken = await result.user.getIdToken();
      await onSuccess(result.user.uid, idToken);
    } catch (err: any) {
      setError(err.message ?? 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {step === 'phone' && !initialPhone ? (
        <>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            onKeyDown={(e) => { if (e.key === 'Enter' && phone.length >= 13 && !loading) sendOtp(); }}
            error={error}
            required
          />
          <Button
            size="full"
            onClick={sendOtp}
            loading={loading}
            disabled={phone.length < 13}
          >
            Send OTP
          </Button>
        </>
      ) : step === 'phone' && initialPhone ? (
        /* Auto-sending state — show a spinner while OTP is dispatched */
        <div className="flex flex-col items-center gap-3 py-4">
          <svg className="h-6 w-6 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-600">Sending OTP to <span className="font-semibold">{phone}</span>…</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-center text-sm text-gray-600">
              OTP sent to <span className="font-medium">{phone}</span>
            </p>
            <OtpInput value={otp} onChange={setOtp} disabled={loading} error={error} />
          </div>
          <Button
            size="full"
            onClick={verifyOtp}
            loading={loading}
            disabled={otp.length !== 6}
          >
            {submitLabel}
          </Button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="w-full text-center text-sm text-red-800 hover:underline"
          >
            Change number
          </button>
        </>
      )}

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
    </div>
  );
}
