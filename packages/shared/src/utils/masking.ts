/**
 * Masking utilities — server-side only.
 * Never call these client-side where raw PII is absent.
 */

/** "Rahul Sharma" → "Ra***" */
export function maskName(name: string): string {
  if (!name || name.trim().length === 0) return '***';
  const trimmed = name.trim();
  const visible = Math.min(2, trimmed.length);
  return trimmed.slice(0, visible) + '***';
}

/**
 * "+919812345678" → "+91 98******78"
 * Works for any E.164 number; shows country code + first 2 + last 2 digits.
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  // Find digits after optional leading +
  const isE164 = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 6) return '***';

  if (isE164 && digits.length >= 10) {
    // Country code: first 2 digits for +91, first 1 for others
    const ccLen = digits.length >= 12 ? 2 : 1;
    const cc = '+' + digits.slice(0, ccLen);
    const local = digits.slice(ccLen);
    const visibleStart = local.slice(0, 2);
    const visibleEnd = local.slice(-2);
    const masked = '*'.repeat(local.length - 4);
    return `${cc} ${visibleStart}${masked}${visibleEnd}`;
  }

  // Fallback: show first 2 + last 2
  const visible = 2;
  return phone.slice(0, visible) + '***' + phone.slice(-2);
}

/**
 * "rahul@gmail.com" → "r***@g***.com"
 * Masks local part (keeps first char) and domain name (keeps first char).
 */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const atIdx = email.indexOf('@');
  if (atIdx < 1) return null;

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  const dotIdx = domain.lastIndexOf('.');
  if (dotIdx < 1) return null;

  const domainName = domain.slice(0, dotIdx);
  const tld = domain.slice(dotIdx); // ".com"

  const maskedLocal = local[0] + '***';
  const maskedDomain = domainName[0] + '***';

  return `${maskedLocal}@${maskedDomain}${tld}`;
}
