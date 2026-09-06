"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  Trash2,
  Star,
  FileImage,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface LocalPhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  caption?: string;
  isCover?: boolean;
}

interface LocalPhotoUploaderProps {
  photos: LocalPhotoItem[];
  onChange: (photos: LocalPhotoItem[]) => void;
  coverPhotoId?: string;
  onSetCover: (photoId: string) => void;
  maxFileSizeMB?: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function LocalPhotoUploader({
  photos,
  onChange,
  coverPhotoId,
  onSetCover,
  maxFileSizeMB = 25,
}: LocalPhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const newItems: LocalPhotoItem[] = [];
      const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
      const maxBytes = maxFileSizeMB * 1024 * 1024;

      let oversizedCount = 0;
      let invalidTypeCount = 0;

      Array.from(files).forEach((file) => {
        if (!acceptedTypes.includes(file.type)) {
          invalidTypeCount++;
          return;
        }

        if (file.size > maxBytes) {
          oversizedCount++;
          return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);

        newItems.push({
          id,
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          isCover: photos.length === 0 && newItems.length === 0,
        });
      });

      if (invalidTypeCount > 0) {
        toast.error(`${invalidTypeCount} file(s) ignored. Only JPG, PNG, WebP, and AVIF are supported.`);
      }

      if (oversizedCount > 0) {
        toast.error(`${oversizedCount} file(s) exceed the ${maxFileSizeMB}MB limit.`);
      }

      if (newItems.length > 0) {
        const updated = [...photos, ...newItems];
        onChange(updated);

        // If no cover is set yet, automatically set the first uploaded photo as cover
        if (!coverPhotoId && newItems[0]) {
          onSetCover(newItems[0].id);
        }

        toast.success(`Added ${newItems.length} photo${newItems.length > 1 ? "s" : ""} to upload queue.`);
      }
    },
    [photos, onChange, coverPhotoId, onSetCover, maxFileSizeMB]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ""; // Reset input so same files can be re-selected if needed
    }
  };

  const handleRemovePhoto = (idToRemove: string) => {
    const photoToRemove = photos.find((p) => p.id === idToRemove);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }

    const updated = photos.filter((p) => p.id !== idToRemove);
    onChange(updated);

    if (coverPhotoId === idToRemove && updated.length > 0) {
      onSetCover(updated[0].id);
    }
  };

  const handleClearAll = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    onChange([]);
  };

  const totalBytes = photos.reduce((acc, p) => acc + p.size, 0);

  return (
    <div className="space-y-4">
      {/* ── Drop Zone (RAYVOY File Upload Style) ────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-[#EBE8E3] bg-gray-50/50 hover:border-primary/50 hover:bg-gray-50/80 dark:border-white/15 dark:bg-dark-2/50 dark:hover:border-primary/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Featured Icon Circle */}
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs group-hover:scale-105 transition-transform">
          <UploadCloud className="size-7" />
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            <span className="text-primary hover:underline font-bold">Click to upload</span> or drag and drop photos
          </p>
          <p className="text-xs text-dark-5 dark:text-dark-6">
            PNG, JPG, WebP, or AVIF (Up to {maxFileSizeMB}MB per photo)
          </p>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#EBE8E3] bg-white px-3.5 py-1 text-xs font-medium text-dark-5 shadow-xs dark:border-white/15 dark:bg-gray-dark dark:text-dark-6">
          <FileImage className="size-3.5 text-primary" />
          <span>Supports batch multi-photo selection</span>
        </div>
      </div>

      {/* ── Local Photos Preview Section ───────────────────────────────────── */}
      {photos.length > 0 && (
        <div className="space-y-3 pt-2">
          {/* Header & Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE8E3] pb-3 dark:border-white/15">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                Photos Ready for Upload ({photos.length})
              </h4>
              <span className="rounded-full bg-ios-light-blue/10 px-2 py-0.5 text-[10px] font-semibold text-ios-light-blue dark:bg-ios-dark-blue/20 dark:text-ios-dark-blue">
                Total: {formatFileSize(totalBytes)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Grid of Preview Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => {
              const isCover = coverPhotoId ? coverPhotoId === photo.id : index === 0;

              return (
                <div
                  key={photo.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-xs transition-all duration-200 dark:bg-gray-dark",
                    isCover
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-[#EBE8E3] hover:border-primary/40 hover:shadow-sm dark:border-white/15"
                  )}
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-dark-2">
                    <Image
                      src={photo.previewUrl}
                      alt={photo.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Cover Photo Badge */}
                    {isCover && (
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Star className="size-3 fill-white" />
                        <span>Cover</span>
                      </div>
                    )}

                    {/* Overlay Action Buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {!isCover && (
                        <button
                          type="button"
                          onClick={() => onSetCover(photo.id)}
                          className="flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm hover:bg-white hover:text-primary transition"
                          title="Set as Event Cover Photo"
                        >
                          <Star className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm hover:bg-white hover:text-red-700 transition"
                        title="Remove photo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="p-2 space-y-0.5">
                    <p className="truncate text-[11px] font-medium text-gray-900 dark:text-gray-100" title={photo.name}>
                      {photo.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-dark-5 dark:text-dark-6">
                      <span>{formatFileSize(photo.size)}</span>
                      {isCover ? (
                        <span className="font-semibold text-primary">Main Cover</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetCover(photo.id)}
                          className="text-dark-5 hover:text-primary transition hover:underline"
                        >
                          Set Cover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
