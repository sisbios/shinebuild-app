import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Converts a phone number string to E.164 format.
 * @param phone raw phone input
 * @param defaultRegion ISO 3166-1 alpha-2 country code (e.g. 'IN')
 * @returns E.164 string or null if invalid
 */
export function toE164(phone: string, defaultRegion = 'IN'): string | null {
  try {
    const parsed = parsePhoneNumber(phone, defaultRegion as any);
    if (parsed && parsed.isValid()) {
      return parsed.format('E.164');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates whether the given string is a valid phone number.
 */
export function isValidPhone(phone: string, defaultRegion = 'IN'): boolean {
  try {
    return isValidPhoneNumber(phone, defaultRegion as any);
  } catch {
    return false;
  }
}

/**
 * Normalizes phone for duplicate detection — strips all non-digits except leading +.
 */
export function normalizePhone(phone: string): string {
  const e164 = toE164(phone);
  return e164 ?? phone.replace(/[^\d+]/g, '');
}
