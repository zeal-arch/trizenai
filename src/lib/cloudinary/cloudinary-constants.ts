/**
 * Gallery management constants
 */

// File size limits
export const FILE_SIZES = {
  IMAGE_MAX: 10 * 1024 * 1024, // 10MB
  VIDEO_MAX: 100 * 1024 * 1024, // 100MB
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
  all: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ],
} as const;

// Accept attributes for file inputs
export const FILE_ACCEPT_ATTRIBUTES = {
  image: "image/*",
  video: "video/mp4,video/quicktime,video/x-msvideo,video/webm",
  all: "image/*,video/*",
} as const;

// Cloudinary settings
export const CLOUDINARY_SETTINGS = {
  folder: "gallery",
  assetsPerPage: 24,
  imageSizes:
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
} as const;

// Default pagination
export const DEFAULT_PAGE_SIZE = 12;
export const PAGE_SIZE_OPTIONS = [8, 12, 16, 24, 32] as const;

// Error messages
export const ERROR_MESSAGES = {
  NO_FILE: "No file provided",
  FILE_TOO_LARGE: (type: "image" | "video") =>
    `File size must be less than ${type === "image" ? "10MB" : "100MB"}`,
  INVALID_FILE_TYPE:
    "Only JPEG, PNG, WebP, GIF images and MP4, MOV, AVI, WEBM videos are allowed",
  UPLOAD_SIGNATURE_FAILED: "Failed to get upload signature",
  UPLOAD_FAILED: "Upload failed",
  FETCH_ASSETS_FAILED: "Unable to load Cloudinary assets",
  NO_TITLE: "Title is required",
  NO_IMAGE_URL: "Image URL is required",
  NO_CATEGORY: "Category is required",
  INVALID_ATTENDEES: "Attendees must be a valid number",
  DELETE_GALLERY_ITEM_FAILED: "Failed to delete gallery item",
  DELETE_CLOUDINARY_ASSET_FAILED: "Failed to delete asset",
  INVALID_URL_FORMAT: (url: string) => `Invalid URL format: ${url}`,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  IMAGE_UPLOADED: "Image uploaded to Cloudinary and added to the form.",
  VIDEO_UPLOADED: "Video uploaded to Cloudinary and added to the form.",
  GALLERY_ITEM_DELETED: "Gallery item deleted successfully",
  CLOUDINARY_ASSETS_DELETED: (count: number) =>
    `${count} asset${count !== 1 ? "s" : ""} deleted from Cloudinary successfully`,
  BULK_UPLOAD_SUCCESS: (count: number) =>
    `${count} gallery item${count !== 1 ? "s" : ""} uploaded successfully`,
} as const;

// Toast titles
export const TOAST_TITLES = {
  SUCCESS: "Success",
  ERROR: "Error",
  PARTIAL_SUCCESS: "Partial Success",
  UPLOAD_SUCCESSFUL: "Upload Successful",
  UPLOAD_FAILED: "Upload Failed",
} as const;
