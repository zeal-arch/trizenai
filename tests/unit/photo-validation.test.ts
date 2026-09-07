import { describe, it, expect } from 'vitest';
import { validateFile, formatFileSize } from '@/lib/cloudinary/cloudinary';

describe('Photo Validation & Upload Constraints', () => {
  it('validates standard JPEG/PNG image uploads', () => {
    const mockFile = new File(['fake-image-content'], 'wedding_photo.jpg', {
      type: 'image/jpeg',
    });
    const result = validateFile(mockFile);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects unsupported file formats like executable or pdf', () => {
    const mockPdf = new File(['fake-doc'], 'document.pdf', {
      type: 'application/pdf',
    });
    const result = validateFile(mockPdf);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/allowed/i);
  });


  it('formats file sizes accurately for display in UI', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1024 * 1024 * 3.5)).toBe('3.50 MB');
    expect(formatFileSize(0)).toBe('Unknown');
  });
});
