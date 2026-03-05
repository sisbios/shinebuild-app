import { describe, it, expect } from 'vitest';
import { toE164, isValidPhone, normalizePhone } from './phone.js';

describe('toE164', () => {
  it('converts Indian mobile with country code', () => {
    expect(toE164('+919876543210')).toBe('+919876543210');
  });
  it('converts Indian mobile without country code using default region', () => {
    expect(toE164('9876543210', 'IN')).toBe('+919876543210');
  });
  it('converts 0-prefixed Indian mobile', () => {
    expect(toE164('09876543210', 'IN')).toBe('+919876543210');
  });
  it('converts US number with region', () => {
    expect(toE164('2125551234', 'US')).toBe('+12125551234');
  });
  it('returns null for invalid number', () => {
    expect(toE164('123')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(toE164('')).toBeNull();
  });
  it('returns null for non-numeric garbage', () => {
    expect(toE164('not-a-phone')).toBeNull();
  });
  it('handles +91 prefix correctly', () => {
    expect(toE164('+91 98765 43210')).toBe('+919876543210');
  });
  it('handles spaces in number', () => {
    expect(toE164('98765 43210', 'IN')).toBe('+919876543210');
  });
  it('handles dashes in number', () => {
    expect(toE164('9876-543-210', 'IN')).toBe('+919876543210');
  });
});

describe('isValidPhone', () => {
  it('validates correct Indian number', () => {
    expect(isValidPhone('+919876543210')).toBe(true);
  });
  it('rejects invalid number', () => {
    expect(isValidPhone('123456')).toBe(false);
  });
});
