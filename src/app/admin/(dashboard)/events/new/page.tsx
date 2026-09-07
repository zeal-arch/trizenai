"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Calendar,
  MapPin,
  Clock,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { LocalPhotoUploader, LocalPhotoItem } from "./_components/local-photo-uploader";

export default function CreateEventPage() {
  const router = useRouter();
  const { isTeamMember, loading: authLoading } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [coverPhotoId, setCoverPhotoId] = useState<string>("");
  const [localPhotos, setLocalPhotos] = useState<LocalPhotoItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isTeamMember) {
      toast.error("Access Restricted: Creating events is reserved for Team Admins.");
      router.replace("/admin/events");
    }
  }, [authLoading, isTeamMember, router]);

  if (authLoading || isTeamMember) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }


  // Active cover photo item
  const selectedCoverPhoto = localPhotos.find((p) => p.id === coverPhotoId) || localPhotos[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Please provide an event title and date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullDateTime = time ? `${date}T${time}:00` : `${date}T00:00:00`;
      const coverImage = selectedCoverPhoto?.previewUrl || "/image/cover/cover-01.png";

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || category || undefined,
          date: fullDateTime,
          location: location || "Studio Venue",
          coverImage,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create event");
      }

      const data = await res.json();
      const newEventId = data.event.id;

      // If local photos were added, upload and save metadata
      if (localPhotos.length > 0) {
        toast.info(`Uploading ${localPhotos.length} photo(s)...`);
        
        for (const localPhoto of localPhotos) {
          try {
            const formData = new FormData();
            formData.append("file", localPhoto.file);
            formData.append("folder", `trizenai-events/${newEventId}`);

            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              await fetch(`/api/events/${newEventId}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  photos: [
                    {
                      publicId: uploadData.asset.publicId,
                      url: uploadData.asset.url,
                      secureUrl: uploadData.asset.secureUrl,
                      thumbnailUrl: uploadData.asset.thumbnailUrl,
                      filename: uploadData.asset.filename,
                      fileSize: uploadData.asset.fileSize,
                      width: uploadData.asset.width,
                      height: uploadData.asset.height,
                      isSelected: true,
                      tags: [],
                    },
                  ],
                }),
              });
            }
          } catch {
            // continue uploading others
          }
        }
      }

      toast.success(`Event "${title}" created in database successfully!`);
      router.push(`/admin/events/${newEventId}/photos`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating event";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Breadcrumb pageName="Create Event" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
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
              Create New Event
            </h1>
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Configure event details, select a cover photo, and preview local photo uploads.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-dark-5 dark:text-dark-6">
            {localPhotos.length} photo{localPhotos.length === 1 ? "" : "s"} selected
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── 1. Event Details Card (RAYVOY Form Style) ──────────────────────── */}
        <div className="rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-xs dark:border-white/15 dark:bg-gray-dark space-y-5">
          <div className="border-b border-[#EBE8E3] pb-3 dark:border-white/15">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              Event Details & Schedule
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-semibold">
                Event Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. TrizenAI Annual Gala 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="size-3 text-dark-5" /> Start Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category" className="text-xs font-semibold flex items-center gap-1">
                    <Tag className="size-3 text-dark-5" /> Event Category
                  </Label>
                  <span className="text-[10px] text-dark-5 dark:text-dark-6">
                    {category.length}/35
                  </span>
                </div>
                <Input
                  id="category"
                  placeholder="e.g. Gala, Product Launch, Wedding"
                  maxLength={35}
                  value={category}
                  onChange={(e) => setCategory(e.target.value.slice(0, 35))}
                  className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="size-3 text-dark-5" /> Venue / Location
              </Label>
              <Input
                id="location"
                placeholder="e.g. The Grand Ballroom, Bangalore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold">
                Event Description & Photographer Notes
              </Label>
              <Textarea
                id="description"
                placeholder="Key moments to capture, lighting setup requirements, or client preferences..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs min-h-[90px] dark:border-white/15 dark:bg-dark-2"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Local Photo Upload & Live Preview Section ────────────────────── */}
        <div className="rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-xs dark:border-white/15 dark:bg-gray-dark space-y-5">
          <div className="border-b border-[#EBE8E3] pb-3 dark:border-white/15 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" />
              Event Photos & Cover Image
            </h3>
            <span className="text-[11px] text-dark-5 dark:text-dark-6">
              Drag & Drop local files for preview
            </span>
          </div>

          {/* Cover Photo Banner Preview (if a photo is selected) */}
          {selectedCoverPhoto && (
            <div className="relative overflow-hidden rounded-xl border border-[#EBE8E3] dark:border-white/15">
              <div className="relative h-44 w-full bg-gray-100 dark:bg-dark-2">
                <Image
                  src={selectedCoverPhoto.previewUrl}
                  alt="Selected cover preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Selected Event Cover
                  </span>
                  <p className="mt-1 text-sm font-semibold truncate max-w-md">
                    {title || "Untitled Event"}
                  </p>
                  <p className="text-[11px] text-white/80">
                    {date || "No date set"} &bull; {location || "Online / Venue"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Local Photo Uploader Component */}
          <LocalPhotoUploader
            photos={localPhotos}
            onChange={setLocalPhotos}
            coverPhotoId={coverPhotoId}
            onSetCover={setCoverPhotoId}
            maxFileSizeMB={25}
          />
        </div>

        {/* ── 3. Bottom Actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/events">
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-xs h-9 px-5 border-[#EBE8E3] dark:border-white/15 bg-white dark:bg-gray-dark hover:bg-gray-50 dark:hover:bg-dark-2"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Creating & Uploading...</span>
            ) : (
              <>
                <Check className="size-3.5" />
                Create Event {localPhotos.length > 0 ? `(${localPhotos.length} Photos)` : ""}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
