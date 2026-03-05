'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Textarea, Button } from '@shinebuild/ui';
import { GeoCapture, type GeoData } from '@/components/shared/GeoCapture';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import { ConsentCheckbox } from '@/components/shared/ConsentCheckbox';
import { submitAgentLead } from '@/app/(agent)/agent/leads/new/actions';

interface Props {
  agentId: string;
}

export function LeadForm({ agentId }: Props) {
  const router = useRouter();
  const [requirementNotes, setRequirementNotes] = useState('');
  const [city, setCity] = useState('');
  const [geo, setGeo] = useState<GeoData | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [draftId] = useState(() => Date.now().toString(36));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!city.trim()) errs['city'] = 'City is required';
    if (!requirementNotes.trim() || requirementNotes.length < 10)
      errs['notes'] = 'Describe the requirement (min 10 chars)';
    if (!geo) errs['geo'] = 'Location is required';
    if (photos.length === 0) errs['photos'] = 'At least 1 photo is required';
    if (!consent) errs['consent'] = 'Customer consent is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await submitAgentLead({
        requirementNotes,
        city,
        geo: geo!,
        photoStoragePaths: photos,
        customerConsent: true,
      });
      if (result.error) {
        setErrors({ submit: result.error });
        return;
      }
      router.push(`/agent/leads/${result.leadId}`);
    } catch {
      setErrors({ submit: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
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
          Requirement Details <span className="text-red-500">*</span>
        </label>
        <textarea
          className="flex min-h-[100px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Describe the customer's requirement, property type, budget, etc."
          value={requirementNotes}
          onChange={(e) => setRequirementNotes(e.target.value)}
        />
        {errors['notes'] && <p className="text-xs text-red-600">{errors['notes']}</p>}
      </div>

      <GeoCapture onCapture={setGeo} value={geo} error={errors['geo']} />

      <PhotoUpload
        agentId={agentId}
        leadDraftId={draftId}
        onUpload={setPhotos}
        value={photos}
        error={errors['photos']}
      />

      <ConsentCheckbox
        checked={consent}
        onChange={setConsent}
        error={errors['consent']}
      />

      {errors['submit'] && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors['submit']}</p>
      )}

      <Button size="full" onClick={handleSubmit} loading={loading}>
        Submit Lead
      </Button>
    </div>
  );
}
