"use client";

import type { PhotoItem } from "@/types";
import { PhotoCard } from "./photo-card";
import { Loader2, ImageIcon } from "lucide-react";

interface PhotoGridProps {
  photos: PhotoItem[];
  selectedIds?: Set<string>;
  isLoading?: boolean;
  canSelect?: boolean;
  canDelete?: boolean;
  onToggleSelect?: (photo: PhotoItem) => void;
  onPreview?: (photo: PhotoItem) => void;
  onDelete?: (photo: PhotoItem) => void;
}

export function PhotoGrid({
  photos,
  selectedIds = new Set(),
  isLoading = false,
  canSelect = true,
  canDelete = true,
  onToggleSelect,
  onPreview,
  onDelete,
}: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE8E3] bg-white/50 dark:border-white/10 dark:bg-dark-2/50">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="mt-2 text-xs text-gray-500 font-medium">Loading event photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE8E3] bg-white/50 dark:border-white/10 dark:bg-dark-2/50 text-center p-6">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <ImageIcon className="size-6" />
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">No photos uploaded yet</h4>
        <p className="text-xs text-gray-500 max-w-sm mt-1">
          Upload event photos using the Bulk Upload tool to start curating customer galleries.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isSelected={selectedIds.has(photo.id)}
          canSelect={canSelect}
          canDelete={canDelete}
          onToggleSelect={onToggleSelect}
          onPreview={onPreview}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
