import { ALLOWED_MIME_TYPES, FILE_SIZES, ERROR_MESSAGES } from "./cloudinary-constants";

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  tags?: string;
}

interface SignatureOptions {
  folder?: string;
  tags?: string[];
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: ERROR_MESSAGES.NO_FILE };
  }

  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? FILE_SIZES.VIDEO_MAX : FILE_SIZES.IMAGE_MAX;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE(isVideo ? "video" : "image"),
    };
  }

  if (!ALLOWED_MIME_TYPES.all.includes(file.type as never)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE,
    };
  }

  return { valid: true };
}

export async function getCloudinarySignature(options: SignatureOptions = {}): Promise<CloudinarySignatureResponse> {
  const { folder = "gallery", tags = ["admin", "gallery"] } = options;

  const response = await fetch("/api/admin/uploads/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      tags,
    }),
  });

  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.UPLOAD_SIGNATURE_FAILED);
  }

  return response.json() as Promise<CloudinarySignatureResponse>;
}

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: 'image' | 'video';
}

// ... existing interfaces ...

export async function uploadFileToCloudinary(
  file: File,
  signature: CloudinarySignatureResponse,
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? 'video' : 'image';

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("folder", signature.folder);
  formData.append("signature", signature.signature);

  if (signature.tags) {
    formData.append("tags", signature.tags);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', endpoint);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            secureUrl: data.secure_url,
            publicId: data.public_id,
            resourceType
          });
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          const errorMessage = data?.error?.message || ERROR_MESSAGES.UPLOAD_FAILED;
          reject(new Error(errorMessage));
        } catch {
          reject(new Error(ERROR_MESSAGES.UPLOAD_FAILED));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error(ERROR_MESSAGES.UPLOAD_FAILED));
    };

    xhr.send(formData);
  });
}

export async function uploadFile(
  file: File,
  options: SignatureOptions = {},
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || ERROR_MESSAGES.UPLOAD_FAILED);
  }

  const signature = await getCloudinarySignature(options);
  return uploadFileToCloudinary(file, signature, onProgress);
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown";
  const kb = bytes / 1024;
  const mb = bytes / (1024 * 1024);
  return mb < 1 ? `${kb.toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
}
