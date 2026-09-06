"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  Lock,
  Filter,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { PhotoGrid } from "@/app/admin/features/photos/photo-grid";
import { BulkUploadModal } from "@/app/admin/features/photos/bulk-upload-modal";
import { GalleryPublishModal } from "@/app/admin/features/galleries/gallery-publish-modal";
import type { PhotoItem } from "@/types";
import { toast } from "sonner";

export default function EventPhotosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);
  const [eventTitle, setEventTitle] = useState("Event Photo Gallery");

  // Sample photo items for initial state
  const [photos, setPhotos] = useState<PhotoItem[]>([
    {
      id: "photo-1",
      eventId,
      uploadedBy: "admin-1",
      publicId: "samples/gala-1",
      url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
      secureUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=80",
      filename: "Gala_Opening_Keynote.jpg",
      fileSize: 4200000,
      width: 4000,
      height: 2667,
      isSelected: true,
      tags: ["keynote", "stage"],
      createdAt: new Date().toISOString(),
    },
    {
      id: "photo-2",
      eventId,
      uploadedBy: "photographer-1",
      publicId: "samples/gala-2",
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      secureUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80",
      filename: "Audience_Clapping.jpg",
      fileSize: 3800000,
      width: 4000,
      height: 2667,
      isSelected: true,
      tags: ["audience"],
      createdAt: new Date().toISOString(),
    },
  ]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(photos.filter((p) => p.isSelected).map((p) => p.id))
  );

  const fetchEventData = useCallback(async () => {
    try {
      // 1. Fetch Event Info
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        if (eventData.event?.title) {
          setEventTitle(eventData.event.title);
        }
      }

      // 2. Fetch Photos
      const photosRes = await fetch(`/api/events/${eventId}/photos`);
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        if (photosData.photos && photosData.photos.length > 0) {
          setPhotos(photosData.photos);
          setSelectedIds(new Set(photosData.photos.filter((p: PhotoItem) => p.isSelected).map((p: PhotoItem) => p.id)));
        }
      }
    } catch {
      // keep fallback
    }
  }, [eventId]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const toggleSelectPhoto = async (photo: PhotoItem) => {
    const nextSelected = !photo.isSelected;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        next.add(photo.id);
      }
      return next;
    });

    setPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, isSelected: nextSelected } : p))
    );

    try {
      await fetch(`/api/events/${eventId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: [photo.id],
          isSelected: nextSelected,
        }),
      });
      if (nextSelected) {
        toast.success(`Selected for gallery: ${photo.filename}`);
      } else {
        toast.info(`Deselected: ${photo.filename}`);
      }
    } catch {
      // update happened locally
    }
  };

  const displayedPhotos = filterSelectedOnly
    ? photos.filter((p) => selectedIds.has(p.id))
    : photos;

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Photo Curation Workspace" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/events">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-[#EBE8E3] bg-primary/10 text-primary shadow-xs transition hover:bg-primary/20 hover:scale-105 dark:border-white/15 dark:bg-primary/20"
              title="Back to Events"
            >
              <ArrowLeft className="size-4.5 text-primary stroke-[2.5]" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Photo Curation & Uploads
            </h1>
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Event ID: <span className="font-mono">{eventId.slice(0, 8)}...</span> · Review uploads, select approved photos, and publish customer galleries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsUploadOpen(true)}
            variant="outline"
            className="rounded-full border-[#EBE8E3] dark:border-white/15 text-xs h-9 px-4 gap-2 hover:border-primary hover:text-primary transition"
          >
            <UploadCloud className="size-4 text-primary" />
            Upload Photos
          </Button>

          <Button
            onClick={() => setIsPublishOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <Lock className="size-4" />
            Publish Gallery ({selectedIds.size})
          </Button>
        </div>
      </div>

      {/* Filter and stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EBE8E3] bg-white p-4 shadow-xs dark:border-white/15 dark:bg-gray-dark">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-dark-5">
            Total Photos: <strong className="text-gray-900 dark:text-white">{photos.length}</strong>
          </span>
          <span className="text-dark-5">·</span>
          <span className="text-emerald-600 font-medium">
            Curated / Selected: <strong>{selectedIds.size}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={filterSelectedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSelectedOnly(!filterSelectedOnly)}
            className={`rounded-full text-xs h-8 px-3 gap-1.5 transition ${
              filterSelectedOnly
                ? "bg-primary text-white"
                : "border-[#EBE8E3] dark:border-white/15 text-dark-5"
            }`}
          >
            <Filter className="size-3" />
            {filterSelectedOnly ? "Showing Selected Only" : "Show Selected Only"}
          </Button>
        </div>
      </div>

      {/* Photo Grid */}
      <PhotoGrid
        photos={displayedPhotos}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectPhoto}
      />

      {/* Modals */}
      <BulkUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        eventId={eventId}
        eventTitle={eventTitle}
        onUploadComplete={() => {
          setIsUploadOpen(false);
          fetchEventData();
          toast.success("Photos uploaded and saved to database!");
        }}
      />

      <GalleryPublishModal
        open={isPublishOpen}
        onOpenChange={setIsPublishOpen}
        eventId={eventId}
        eventTitle={eventTitle}
        selectedCount={selectedIds.size}
        onSuccess={() => {
          setIsPublishOpen(false);
          fetchEventData();
          toast.success("Customer gallery published successfully!");
        }}
      />
    </div>
  );
}
