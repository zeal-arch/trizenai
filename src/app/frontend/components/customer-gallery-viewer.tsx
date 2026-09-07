"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Eye, X, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/button";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  width?: number;
  height?: number;
}

interface CustomerGalleryViewerProps {
  title: string;
  eventTitle?: string;
  publishedAt?: string;
  photos: Photo[];
  onLockGallery?: () => void;
}

export function CustomerGalleryViewer({
  title,
  eventTitle,
  publishedAt,
  photos,
  onLockGallery,
}: CustomerGalleryViewerProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const activePhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  const nextPhoto = () => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (activePhotoIndex === null) return;
    setActivePhotoIndex((activePhotoIndex - 1 + photos.length) % photos.length);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E7EAF6] bg-[#F8F9FE]/90 backdrop-blur-md px-6 py-4 shadow-xs">
        <div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {eventTitle && (
            <p className="text-xs text-gray-500 mt-0.5 font-normal">
              {eventTitle} • {photos.length} curated photograph{photos.length !== 1 ? "s" : ""}
              {publishedAt ? ` • ${new Date(publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onLockGallery && (
            <Button
              type="button"
              variant="outline"
              onClick={onLockGallery}
              className="border-[#D6DAF0] bg-white hover:bg-primary-50 text-gray-700 hover:text-primary transition-all text-xs font-medium flex items-center gap-1.5 shadow-xs rounded-xl px-3.5 py-2 cursor-pointer"
            >
              <Lock className="size-3.5 text-primary" />
              <span>Lock Gallery</span>
            </Button>
          )}
        </div>
      </header>

      {/* Photo Grid */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center rounded-3xl border border-dashed border-[#D6DAF0] bg-white/60 p-8 shadow-xs">
            <div className="size-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary text-2xl mb-4 shadow-inner">
              🖼️
            </div>
            <p className="text-base font-semibold text-gray-800">No photos in this gallery yet.</p>
            <p className="text-xs mt-1 text-gray-500">The photographer has not added any photos to this curated collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setActivePhotoIndex(idx)}
                className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-white border border-[#E7EAF6] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-xs"
              >
                <Image
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <span className="text-xs font-medium text-white truncate max-w-[160px] drop-shadow-sm">{photo.filename}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={photo.url}
                      download={photo.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-xs transition text-white"
                      title="Download Photo"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="size-3.5" />
                    </a>
                    <button
                      type="button"
                      className="p-1.5 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur-xs transition text-white"
                      title="View Fullscreen"
                    >
                      <Eye className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-50"
          >
            <X className="size-6" />
          </button>

          {/* Navigation Controls */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-50"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-50"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          {/* Main Photo View */}
          <div className="relative max-h-[85vh] max-w-[90vw] aspect-auto flex flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.url}
              alt={activePhoto.filename}
              className="max-h-[80vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between w-full max-w-xl px-2 text-xs text-gray-400">
              <span>{activePhoto.filename}</span>
              <span>{(activePhotoIndex ?? 0) + 1} of {photos.length}</span>
              <a
                href={activePhoto.url}
                download={activePhoto.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-softPeriwinkle hover:underline font-medium"
              >
                <Download className="size-4" />
                <span>Download Full Res</span>
              </a>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
