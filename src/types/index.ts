export type UserRole = 'ADMIN' | 'TEAM_MEMBER';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  coverImage?: string | null;
  createdBy: string;
  creatorName?: string;
  teamMembers?: EventMemberItem[];
  photoCount?: number;
  selectedPhotoCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EventMemberItem {
  id: string;
  eventId: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userAvatar?: string | null;
  assignedAt: string;
}

export interface PhotoItem {
  id: string;
  eventId: string;
  uploadedBy: string;
  uploaderName?: string;
  uploaderEmail?: string;
  uploader?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
  };
  publicId: string;
  url: string;
  secureUrl: string;
  thumbnailUrl?: string;
  filename: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  isSelected: boolean;
  tags?: string[];
  createdAt: string;
}


export interface GalleryItem {
  id: string;
  eventId: string;
  eventTitle?: string;
  title: string;
  slug: string;
  hasPin: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  viewCount: number;
  photoCount?: number;
  photos?: PhotoItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CloudinaryUploadResponse {
  secureUrl: string;
  publicId: string;
  filename: string;
  fileSize: number;
  width?: number;
  height?: number;
  resourceType: 'image' | 'video';
}

export interface GalleryVerificationResult {
  valid: boolean;
  token?: string;
  gallery?: {
    id: string;
    title: string;
    eventTitle?: string;
    publishedAt: string;
    photos: {
      id: string;
      url: string;
      thumbnailUrl?: string;
      filename: string;
      width?: number;
      height?: number;
    }[];
  };
  error?: string;
}
