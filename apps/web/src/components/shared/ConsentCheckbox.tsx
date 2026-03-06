'use client';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  error?: string;
}

export function ConsentCheckbox({
  checked,
  onChange,
  label = 'The customer has given consent to share their contact details and be contacted by Shine Build Hub.',
  error,
}: Props) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-red-700 focus:ring-red-700"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
      {error && <p className="ml-7 text-xs text-red-600">{error}</p>}
    </div>
  );
}
