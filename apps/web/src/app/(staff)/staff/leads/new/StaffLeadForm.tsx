'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import { submitStaffLead } from './actions';

interface Props {
  staffId: string;
  serviceItems: Array<{ id: string; name: string }>;
}

export function StaffLeadForm({ staffId, serviceItems }: Props) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('');
  const [requirementNotes, setRequirementNotes] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [staffNotes, setStaffNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ leadId: string } | null>(null);

  const toggleService = (name: string) =>
    setServices((prev) => prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerName.trim() || customerName.trim().length < 2) e['name'] = 'Name must be at least 2 characters';
    if (!customerPhone.trim()) e['phone'] = 'Phone number is required';
    if (!city.trim() || city.trim().length < 2) e['city'] = 'City is required';
    if (!requirementNotes.trim() || requirementNotes.trim().length < 5) e['notes'] = 'Describe the requirement (min 5 characters)';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await submitStaffLead({
        customerName,
        customerPhone,
        customerEmail,
        city,
        requirementNotes,
        services,
        photos,
        staffNotes,
      });
      if (res.error) { setErrors({ submit: res.error }); return; }
      setSuccess({ leadId: res.leadId! });
    } catch {
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Lead Submitted</h2>
          <p className="text-sm text-gray-500 mt-1">The lead has been created and assigned to you.</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">Ref: {success.leadId.slice(-6).toUpperCase()}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => router.push(`/staff/leads/${success.leadId}`)}
            className="flex-1 rounded-xl brand-gradient py-2.5 text-sm font-semibold text-white"
          >
            View Lead
          </button>
          <button
            onClick={() => {
              setSuccess(null);
              setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
              setCity(''); setRequirementNotes(''); setServices([]);
              setPhotos([]); setStaffNotes(''); setErrors({});
            }}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Customer Info */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-bold">1</span>
          Customer Details
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80 ${errors['name'] ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors['name'] && <p className="mt-1 text-xs text-red-600">{errors['name']}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="9876543210 or +919876543210"
            inputMode="tel"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80 ${errors['phone'] ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors['phone'] && <p className="mt-1 text-xs text-red-600">{errors['phone']}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email (optional)</label>
          <input
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="customer@example.com"
            inputMode="email"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Thrissur"
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80 ${errors['city'] ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors['city'] && <p className="mt-1 text-xs text-red-600">{errors['city']}</p>}
        </div>
      </div>

      {/* Requirement */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-bold">2</span>
          Requirement
        </h2>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Requirement Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            value={requirementNotes}
            onChange={(e) => setRequirementNotes(e.target.value)}
            placeholder="Describe what the customer needs — project type, area, budget, timeline, etc."
            rows={3}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80 resize-none ${errors['notes'] ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors['notes'] && <p className="mt-1 text-xs text-red-600">{errors['notes']}</p>}
        </div>

        {serviceItems.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Services Interested In</label>
            <div className="grid grid-cols-2 gap-2">
              {serviceItems.map((item) => {
                const checked = services.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleService(item.name)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      checked ? 'bg-red-50 border border-red-300 text-red-800' : 'bg-white border border-gray-200 text-gray-700'
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
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-bold">3</span>
          Photos <span className="text-xs font-normal text-gray-400">(optional)</span>
        </h2>
        <PhotoUpload
          agentId={staffId}
          leadDraftId={'staff-draft-' + staffId}
          onUpload={setPhotos}
          value={photos}
        />
      </div>

      {/* Staff notes */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center text-white text-[10px] font-bold">4</span>
          Your Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
        </h2>
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          placeholder="Internal notes — urgency, how you found this lead, follow-up reminders, etc."
          rows={2}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white/80 resize-none"
        />
      </div>

      {errors['submit'] && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errors['submit']}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3.5 text-base font-semibold text-white shadow-md disabled:opacity-60 transition-opacity active:scale-[0.98]"
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
