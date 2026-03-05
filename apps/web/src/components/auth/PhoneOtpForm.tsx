'use client';

import React, { useState, useRef } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client';
import { Button } from '@shinebuild/ui';
import { OtpInput } from '@shinebuild/ui';
import { Input } from '@shinebuild/ui';
import { toE164 } from '@shinebuild/shared';

interface Props {
  onSuccess: (uid: string, idToken: string) => Promise<void>;
  submitLabel?: string;
}

export function PhoneOtpForm({ onSuccess, submitLabel = 'Verify & Continue' }: Props) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

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
      {step === 'phone' ? (
        <>
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={error}
            required
            autoComplete="tel"
            inputMode="tel"
          />
          <Button
            size="full"
            onClick={sendOtp}
            loading={loading}
            disabled={!phone}
          >
            Send OTP
          </Button>
        </>
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
            className="w-full text-center text-sm text-orange-600 hover:underline"
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
