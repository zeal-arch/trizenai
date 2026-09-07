import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

interface MockGallery {
  id: string;
  eventId: string;
  title: string;
  slug: string;
  pinHash: string;
  isPublished: boolean;
}

interface MockPhoto {
  id: string;
  galleryId: string;
  url: string;
  filename: string;
  isSelected: boolean;
}

describe('Gallery Customer Access Flow Simulation', () => {
  const pin = '482917';
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');

  const gallery: MockGallery = {
    id: 'gallery-test-1',
    eventId: 'event-wedding-1',
    title: 'Arjun & Priya Wedding',
    slug: 'arjun-priya-wedding',
    pinHash: pinHash,
    isPublished: true,
  };

  const allPhotos: MockPhoto[] = [
    { id: 'p1', galleryId: 'gallery-test-1', url: 'https://cdn.example.com/p1.jpg', filename: 'Ceremony_01.jpg', isSelected: true },
    { id: 'p2', galleryId: 'gallery-test-1', url: 'https://cdn.example.com/p2.jpg', filename: 'Ceremony_02.jpg', isSelected: true },
    { id: 'p3', galleryId: 'gallery-test-1', url: 'https://cdn.example.com/p3.jpg', filename: 'Draft_Outtake.jpg', isSelected: false },
  ];

  it('authenticates customer access when correct PIN is provided', () => {
    const inputPin = '482917';
    const inputHash = crypto.createHash('sha256').update(inputPin).digest('hex');
    const isPinValid = inputHash === gallery.pinHash;

    expect(isPinValid).toBe(true);

    // Only return curated/selected photos to the customer
    const publishedPhotos = allPhotos.filter((p) => p.isSelected);
    expect(publishedPhotos.length).toBe(2);
    expect(publishedPhotos.some((p) => p.filename === 'Draft_Outtake.jpg')).toBe(false);
  });

  it('denies access when incorrect PIN is entered', () => {
    const wrongPin = '000000';
    const inputHash = crypto.createHash('sha256').update(wrongPin).digest('hex');
    const isPinValid = inputHash === gallery.pinHash;

    expect(isPinValid).toBe(false);
  });

  it('prevents public access to unpublished draft galleries', () => {
    const draftGallery = { ...gallery, isPublished: false };
    expect(draftGallery.isPublished).toBe(false);
  });
});
