export type UserRole = 'ADMIN' | 'TEAM_MEMBER';

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


