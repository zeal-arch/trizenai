import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary server-side
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jttdbmtt';
const apiKey = process.env.CLOUDINARY_API_KEY || '188187544151153';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'vMlk7W31smhMXo4qDP8UXIaPTXU';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

export interface CloudinaryServerUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
}

/**
 * Upload a Buffer or Base64 string directly to Cloudinary
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string = 'trizenai-events',
  filename?: string
): Promise<CloudinaryServerUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        filename_override: filename,
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }

        // Generate responsive thumbnail URL
        const thumbnailUrl = cloudinary.url(result.public_id, {
          width: 400,
          crop: 'scale',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true,
        });

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          thumbnailUrl: thumbnailUrl || result.secure_url,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch {
    return false;
  }
}
