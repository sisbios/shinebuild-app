'use client';

import * as React from 'react';
import { cn } from './utils.js';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function OtpInput({ length = 6, value, onChange, disabled, error }: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index: number, char: string) => {
    const cleaned = char.replace(/\D/g, '');
    // Multi-digit input: autofill (autocomplete="one-time-code") or paste into a box
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      const chars = cleaned.slice(0, length - index).split('');
      chars.forEach((c, j) => { newDigits[index + j] = c; });
      onChange(newDigits.join(''));
      inputRefs.current[Math.min(index + chars.length, length - 1)]?.focus();
      return;
    }
    const digit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    onChange(newDigits.join(''));
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Auto-focus first box on mount so the OS keyboard suggestion appears immediately
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, '').slice(0, length));
    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? 6 : 1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'h-12 w-10 rounded-lg border text-center text-lg font-bold',
              'focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500',
              'disabled:bg-gray-50 disabled:opacity-60',
              error ? 'border-red-400' : 'border-gray-300'
            )}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
