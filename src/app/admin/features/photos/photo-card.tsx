"use client";

import { memo, type FC, type MouseEvent } from "react";
import Image from "next/image";
import { Check, Trash2, Eye, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge";
import type { PhotoItem } from "@/types";

interface PhotoCardProps {
  photo: PhotoItem;
  isSelected?: boolean;
  canSelect?: boolean;
  canDelete?: boolean;
  onToggleSelect?: (photo: PhotoItem) => void;
  onPreview?: (photo: PhotoItem) => void;
  onDelete?: (photo: PhotoItem) => void;
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const PhotoCardComponent: FC<PhotoCardProps> = ({
  photo,
  isSelected = false,
  canSelect = true,
  canDelete = true,
  onToggleSelect,
  onPreview,
  onDelete,
}) => {
  const handleSelectClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (canSelect && onToggleSelect) {
      onToggleSelect(photo);
    }
  };

  const handlePreviewClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(photo);
    }
  };

  const handleDeleteClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(photo);
    }
  };

  return (
    <div
      onClick={handlePreviewClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white dark:bg-dark-2 transition-all duration-200 cursor-pointer hover:shadow-lg",
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-[#EBE8E3] hover:border-primary/40 dark:border-white/10 dark:hover:border-primary/40"
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-dark-3">
        <Image
          src={photo.thumbnailUrl || photo.secureUrl || photo.url}
          alt={photo.filename}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Selection Checkmark Overlay */}
        {canSelect && (
          <button
            type="button"
            onClick={handleSelectClick}
            className={cn(
              "absolute top-2.5 left-2.5 z-10 flex size-7 items-center justify-center rounded-full transition-all shadow-md",
              isSelected
                ? "bg-indigo-600 text-white"
                : "bg-black/40 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-black/60"
            )}
            title={isSelected ? "Remove from selection" : "Select for gallery"}
          >
            <Check className="size-4 stroke-[2.5]" />
          </button>
        )}

        {/* Top-Right Badges */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {photo.isSelected && (
            <Badge variant="default" className="bg-emerald-600/90 text-white text-[10px] px-1.5 py-0.5 backdrop-blur-xs">
              Selected
            </Badge>
          )}
        </div>

        {/* Bottom Hover Actions */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviewClick}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs transition"
              title="Preview Photo"
            >
              <Eye className="size-3.5" />
            </button>
            <a
              href={photo.secureUrl || photo.url}
              download={photo.filename}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs transition"
              title="Download Original"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="size-3.5" />
            </a>
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 backdrop-blur-xs transition text-white"
              title="Delete Photo"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-xs text-gray-900 dark:text-white truncate" title={photo.filename}>
            {photo.filename}
          </p>
          <span className="text-[10px] text-gray-400 font-mono shrink-0">
            {formatBytes(photo.fileSize)}
          </span>
        </div>

        {photo.uploaderName && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-1">
            Uploaded by <span className="font-medium text-gray-700 dark:text-gray-300">{photo.uploaderName}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export const PhotoCard = memo(PhotoCardComponent);
