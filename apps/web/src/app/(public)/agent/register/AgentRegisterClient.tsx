'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';
import { Input, Button } from '@shinebuild/ui';
import { registerAgent } from './actions';

type Step = 'otp' | 'profile';

export function AgentRegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('otp');
  const [uid, setUid] = useState('');
  const [idToken, setIdToken] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOtpSuccess = async (verifiedUid: string, token: string) => {
    setUid(verifiedUid);
    setIdToken(token);
    setStep('profile');
  };

  const handleRegister = async () => {
    if (!name.trim() || !city.trim()) {
      setError('Name and city are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await registerAgent({ idToken, name: name.trim(), city: city.trim(), district: district.trim() });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push('/agent/pending');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return <PhoneOtpForm onSuccess={handleOtpSuccess} submitLabel="Continue" />;
  }

  return (
    <div className="space-y-4">
      <Input
        label="Full Name"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
      />
      <Input
        label="City"
        placeholder="e.g. Mumbai"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        required
      />
      <Input
        label="District (optional)"
        placeholder="e.g. Thane"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="full" onClick={handleRegister} loading={loading}>
        Submit for Approval
      </Button>
    </div>
  );
}
