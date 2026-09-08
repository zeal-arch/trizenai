import { describe, it, expect } from 'vitest';
import {
  decryptGalleryPin,
  encryptGalleryPin,
  hashGalleryPin,
  isValidGalleryPin,
  verifyGalleryPin,
} from '@/lib/security/gallery-pin';

describe('PIN Security & Verification Tests', () => {
  it('correctly hashes a standard 6-digit PIN using SHA-256', () => {
    const pin = '482917';
    const hash = hashGalleryPin(pin);
    expect(hash).toBeTypeOf('string');
    expect(hash.length).toBe(64);
  });

  it('verifies a valid PIN against its stored hash successfully', () => {
    const rawPin = '123456';
    const storedHash = hashGalleryPin(rawPin);
    expect(verifyGalleryPin(rawPin, storedHash)).toBe(true);
  });

  it('rejects an incorrect PIN with timing-safe comparison', () => {
    const realPin = '987654';
    const wrongPin = '111111';
    const storedHash = hashGalleryPin(realPin);
    expect(verifyGalleryPin(wrongPin, storedHash)).toBe(false);
  });

  it('rejects invalid PIN formats (e.g. too short or empty)', () => {
    const storedHash = hashGalleryPin('123456');
    expect(verifyGalleryPin('', storedHash)).toBe(false);
    expect(verifyGalleryPin('12', storedHash)).toBe(false);
  });

  it('accepts only numeric PINs from 4 to 6 digits', () => {
    expect(isValidGalleryPin('1234')).toBe(true);
    expect(isValidGalleryPin('123456')).toBe(true);
    expect(isValidGalleryPin('123')).toBe(false);
    expect(isValidGalleryPin('1234567')).toBe(false);
    expect(isValidGalleryPin('12ab')).toBe(false);
  });

  it('encrypts and decrypts PINs without storing plaintext', () => {
    const previousKey = process.env.GALLERY_PIN_ENCRYPTION_KEY;
    process.env.GALLERY_PIN_ENCRYPTION_KEY = 'test-only-gallery-pin-key';

    try {
      const encrypted = encryptGalleryPin('482917');
      expect(encrypted).not.toContain('482917');
      expect(decryptGalleryPin(encrypted)).toBe('482917');
    } finally {
      if (previousKey === undefined) delete process.env.GALLERY_PIN_ENCRYPTION_KEY;
      else process.env.GALLERY_PIN_ENCRYPTION_KEY = previousKey;
    }
  });
});
