import { describe, it, expect } from 'vitest';
import { maskName, maskPhone, maskEmail } from './masking.js';

describe('maskName', () => {
  it('masks full name to first 2 chars + ***', () => {
    expect(maskName('Rahul Sharma')).toBe('Ra***');
  });
  it('handles single char name', () => {
    expect(maskName('A')).toBe('A***');
  });
  it('handles two char name', () => {
    expect(maskName('Jo')).toBe('Jo***');
  });
  it('handles empty string', () => {
    expect(maskName('')).toBe('***');
  });
  it('handles whitespace only', () => {
    expect(maskName('   ')).toBe('***');
  });
  it('trims before masking', () => {
    expect(maskName('  Priya  ')).toBe('Pr***');
  });
});

describe('maskPhone', () => {
  it('masks Indian +91 number correctly', () => {
    expect(maskPhone('+919812345678')).toBe('+91 98******78');
  });
  it('shows 2 visible digits at start and end of local part', () => {
    const result = maskPhone('+919999900001');
    // +91 prefix, local=9999900001 (10 digits), 2 visible start + 6 masked + 2 visible end
    expect(result).toBe('+91 99******01');
  });
  it('handles +1 US number', () => {
    const result = maskPhone('+12125551234');
    expect(result).toMatch(/^\+1 \d{2}\*+\d{2}$/);
  });
  it('handles short number gracefully', () => {
    expect(maskPhone('+123')).toBe('***');
  });
  it('handles empty string', () => {
    expect(maskPhone('')).toBe('***');
  });
});

describe('maskEmail', () => {
  it('masks standard email', () => {
    expect(maskEmail('rahul@gmail.com')).toBe('r***@g***.com');
  });
  it('masks email with longer local part', () => {
    expect(maskEmail('john.doe@company.org')).toBe('j***@c***.org');
  });
  it('returns null for null input', () => {
    expect(maskEmail(null)).toBeNull();
  });
  it('returns null for undefined input', () => {
    expect(maskEmail(undefined)).toBeNull();
  });
  it('returns null for invalid email (no @)', () => {
    expect(maskEmail('notanemail')).toBeNull();
  });
  it('returns null for email with no domain name', () => {
    expect(maskEmail('a@.com')).toBeNull();
  });
});
