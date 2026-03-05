'use client';

import { useState } from 'react';
import { Input, Button } from '@shinebuild/ui';
import { OtpInput } from '@shinebuild/ui';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';
import { ConsentCheckbox } from '@/components/shared/ConsentCheckbox';
import { submitQrLead } from './actions';
import { toE164 } from '@shinebuild/shared';

type Step = 'form' | 'otp' | 'confirm';

interface Props {
  tokenId: string;
}

export function QrLeadFlow({ tokenId }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [requirementNotes, setRequirementNotes] = useState('');
  const [city, setCity] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ leadId: string; referenceId: string } | null>(null);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs['name'] = 'Name is required';
    if (!phone.trim()) errs['phone'] = 'Phone is required';
    else if (!toE164(phone)) errs['phone'] = 'Enter a valid Indian mobile number';
    if (!requirementNotes.trim() || requirementNotes.length < 10)
      errs['notes'] = 'Describe your requirement (min 10 chars)';
    if (!city.trim()) errs['city'] = 'City is required';
    if (!consent) errs['consent'] = 'Please provide consent';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormNext = () => {
    if (validateForm()) setStep('otp');
  };

  const handleOtpSuccess = async (_uid: string, _idToken: string) => {
    // OTP verified — submit the lead
    setLoading(true);
    try {
      const e164 = toE164(phone)!;
      const res = await submitQrLead({
        tokenId,
        name,
        phone: e164,
        ...(email ? { email } : {}),
        requirementNotes,
        city,
      });
      if (res.error) {
        setErrors({ submit: res.error });
        setStep('form');
        return;
      }
      setResult({ leadId: res.leadId!, referenceId: res.referenceId! });
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm' && result) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Submitted!</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your details have been submitted successfully.
          </p>
          <p className="mt-3 text-xs text-gray-500">
            Reference ID: <span className="font-mono font-bold text-gray-800">{result.referenceId}</span>
          </p>
        </div>
        <p className="text-xs text-gray-400">Our team will contact you shortly.</p>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Verify your number</h2>
          <p className="text-sm text-gray-500">We'll send an OTP to confirm your identity</p>
        </div>
        <PhoneOtpForm onSuccess={handleOtpSuccess} submitLabel="Submit Lead" />
        <button
          onClick={() => setStep('form')}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Back to form
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Share your requirements</h2>
        <p className="text-sm text-gray-500">Your details are encrypted and secure</p>
      </div>

      <Input
        label="Your Name"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors['name']}
        required
        autoComplete="name"
      />
      <Input
        label="Mobile Number"
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors['phone']}
        required
        autoComplete="tel"
      />
      <Input
        label="Email (optional)"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <Input
        label="City"
        placeholder="e.g. Mumbai"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        error={errors['city']}
        required
      />
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Requirement <span className="text-red-500">*</span>
        </label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Describe what you're looking for..."
          value={requirementNotes}
          onChange={(e) => setRequirementNotes(e.target.value)}
        />
        {errors['notes'] && <p className="text-xs text-red-600">{errors['notes']}</p>}
      </div>

      <ConsentCheckbox
        checked={consent}
        onChange={setConsent}
        label="I consent to Shine Build Hub contacting me about my requirement."
        error={errors['consent']}
      />

      {errors['submit'] && (
        <p className="text-sm text-red-600">{errors['submit']}</p>
      )}

      <Button size="full" onClick={handleFormNext}>
        Continue to Verify
      </Button>
    </div>
  );
}
