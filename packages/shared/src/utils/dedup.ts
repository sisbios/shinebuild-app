import { normalizePhone } from './phone.js';

/**
 * Normalizes a customer record for duplicate detection.
 */
export function normalizeDupKey(phoneE164: string): string {
  return normalizePhone(phoneE164).replace(/\D/g, '');
}

/**
 * Checks if two phone numbers refer to the same subscriber.
 */
export function isSamePhone(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb;
}
