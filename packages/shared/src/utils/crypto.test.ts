import { describe, it, expect } from 'vitest';
import { generateToken, sha256Hex } from './crypto.js';

describe('generateToken', () => {
  it('generates 64-char hex string by default (32 bytes)', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });
  it('generates correct length for custom byte count', () => {
    expect(generateToken(16)).toHaveLength(32);
    expect(generateToken(64)).toHaveLength(128);
  });
  it('generates unique tokens on each call', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });
  it('token is hex-only (no non-hex chars)', () => {
    for (let i = 0; i < 5; i++) {
      expect(generateToken()).toMatch(/^[0-9a-f]+$/);
    }
  });
});

describe('sha256Hex', () => {
  it('returns 64-char hex string', () => {
    const hash = sha256Hex('hello');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
  it('is deterministic for same input', () => {
    expect(sha256Hex('test')).toBe(sha256Hex('test'));
  });
  it('produces different hashes for different inputs', () => {
    expect(sha256Hex('abc')).not.toBe(sha256Hex('xyz'));
  });
  it('matches known SHA-256 hash of empty string', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });
  it('matches known hash of "hello"', () => {
    expect(sha256Hex('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });
});
