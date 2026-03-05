import { randomBytes, createHash } from 'node:crypto';

/**
 * Generates a cryptographically secure random hex token.
 * @param bytes number of random bytes (output length = bytes * 2 hex chars)
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Computes SHA-256 hash of a string, returned as hex.
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}
