import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin.trim()).digest('hex');
}

function verifyPin(inputPin: string, storedHash: string): boolean {
  if (!inputPin || inputPin.length < 4 || inputPin.length > 8) {
    return false;
  }
  const inputHash = hashPin(inputPin);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}

describe('PIN Security & Verification Tests', () => {
  it('correctly hashes a standard 6-digit PIN using SHA-256', () => {
    const pin = '482917';
    const hash = hashPin(pin);
    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(64);
  });

  it('verifies a valid PIN against its stored hash successfully', () => {
    const rawPin = '123456';
    const storedHash = hashPin(rawPin);
    expect(verifyPin(rawPin, storedHash)).toBe(true);
  });

  it('rejects an incorrect PIN with timing-safe comparison', () => {
    const realPin = '987654';
    const wrongPin = '111111';
    const storedHash = hashPin(realPin);
    expect(verifyPin(wrongPin, storedHash)).toBe(false);
  });

  it('rejects invalid PIN formats (e.g. too short or empty)', () => {
    const storedHash = hashPin('123456');
    expect(verifyPin('', storedHash)).toBe(false);
    expect(verifyPin('12', storedHash)).toBe(false);
  });
});
