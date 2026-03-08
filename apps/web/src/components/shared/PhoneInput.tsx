'use client';

interface Props {
  value: string;          // full string e.g. "+919876543210"
  onChange: (v: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}

/**
 * Phone input with a fixed +91 prefix.
 * `value` / onChange always carry the full "+91XXXXXXXXXX" string.
 * The user only types the 10-digit subscriber number.
 */
export function PhoneInput({
  value,
  onChange,
  error,
  label = 'Mobile Number',
  required,
  autoComplete = 'tel',
  className = '',
}: Props) {
  // Strip +91 prefix so we only show the local digits in the box
  const digits = value.startsWith('+91') ? value.slice(3) : value.replace(/^\+/, '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange('+91' + raw);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className={`flex overflow-hidden rounded-xl border ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200 focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600'} bg-white/70 transition-all`}>
        <span className="flex items-center bg-gray-50 border-r border-gray-200 px-3 text-sm font-semibold text-gray-600 select-none">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          value={digits}
          onChange={handleChange}
          placeholder="98765 43210"
          maxLength={10}
          required={required}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
