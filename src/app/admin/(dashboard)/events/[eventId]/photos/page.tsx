"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UploadCloud,
  Lock,
  Filter,
  User,
  Layers,
  ExternalLink,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { PhotoGrid } from "@/app/admin/features/photos/photo-grid";
import { BulkUploadModal } from "@/app/admin/features/photos/bulk-upload-modal";
import { GalleryPublishModal } from "@/app/admin/features/galleries/gallery-publish-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { PhotoItem } from "@/types";
import { toast } from "sonner";

export default function EventPhotosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();
  const { user, isAdmin, isTeamMember } = useCurrentUser();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"all" | "my_uploads">("all");
  const [filterSelectedOnly, setFilterSelectedOnly] = useState(false);
  const [eventTitle, setEventTitle] = useState("Event Photo Gallery");
  const [gallerySlug, setGallerySlug] = useState<string | null>(null);
  const [galleryPin, setGalleryPin] = useState<string | null>(null);
  const [galleryTitle, setGalleryTitle] = useState<string | null>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  // Photo list state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchEventData = useCallback(async () => {
    try {
      setLoadingPhotos(true);
      // 1. Fetch Event Info
      const eventRes = await fetch(`/api/events/${eventId}`);
      if (eventRes.status === 403) {
        toast.error("Access Denied: You are not assigned to this event.");
        router.replace("/admin/events");
        return;
      }
      if (eventRes.status === 401) {
        toast.error("Please log in to view this event.");
        router.replace("/admin/login");
        return;
      }
      if (eventRes.ok) {
        const eventData = await eventRes.json();
        if (eventData.event?.title) {
          setEventTitle(eventData.event.title);
        }
        if (eventData.event?.gallery) {
          setGallerySlug(eventData.event.gallery.slug || null);
          setGalleryTitle(eventData.event.gallery.title || null);
          setGalleryId(eventData.event.gallery.id || null);
          if (eventData.event.gallery.pin) {
            setGalleryPin(eventData.event.gallery.pin);
          }
        }
      }

      // 2. Fetch Photos
      const photosRes = await fetch(`/api/events/${eventId}/photos`);
      if (photosRes.status === 403) {
        toast.error("Access Denied: You are not assigned to this event.");
        router.replace("/admin/events");
        return;
      }
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        if (photosData.photos) {
          setPhotos(photosData.photos);
          setSelectedIds(
            new Set(
              photosData.photos
                .filter((p: PhotoItem) => p.isSelected)
                .map((p: PhotoItem) => p.id)
            )
          );
        }
      }
    } catch {
      // keep fallback
    } finally {
      setLoadingPhotos(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const toggleSelectPhoto = async (photo: PhotoItem) => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Team Admins can curate gallery photos.");
      return;
    }

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
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: [photo.id],
          isSelected: nextSelected,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update curation");
        fetchEventData();
        return;
      }

      if (nextSelected) {
        toast.success(`Selected for gallery: ${photo.filename}`);
      } else {
        toast.info(`Deselected: ${photo.filename}`);
      }
    } catch {
      // update happened locally
    }
  };

  const isPhotoOwner = useCallback((photo: PhotoItem) => {
    if (!user) return false;
    return photo.uploadedBy === user.id || (!!user.authId && photo.uploadedBy === user.authId);
  }, [user]);

  const handleDeletePhoto = async (photo: PhotoItem) => {
    // Team Members can only delete photos they uploaded themselves
    if (!isAdmin && !isPhotoOwner(photo)) {
      toast.error("Permission Denied: Team Members can only delete photos they uploaded themselves.");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: [photo.id],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete photo");
        return;
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });

      toast.success(`Deleted photo ${photo.filename}`);
    } catch {
      toast.error("Failed to delete photo.");
    }
  };

  const handleCopyLink = () => {
    if (!gallerySlug) return;
    const url = `${window.location.origin}/gallery/${gallerySlug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Gallery link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyPin = () => {
    if (!galleryPin) return;
    navigator.clipboard.writeText(galleryPin);
    setCopiedPin(true);
    toast.success("Access PIN copied to clipboard!");
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleCopyInvite = () => {
    if (!gallerySlug) return;
    const url = `${window.location.origin}/gallery/${gallerySlug}`;
    const text = `📸 ${eventTitle} - Client Photo Gallery\n🔗 Access Link: ${url}\n🔑 Access PIN: ${galleryPin || "123456"}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    toast.success("Complete client invite text copied to clipboard!");
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const myPhotos = user ? photos.filter(isPhotoOwner) : [];

  // Filter based on tab and curation filter
  let displayedPhotos = viewTab === "my_uploads" ? myPhotos : photos;
  if (filterSelectedOnly && isAdmin) {
    displayedPhotos = displayedPhotos.filter((p) => selectedIds.has(p.id));
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName={isTeamMember ? "Event Photos & Uploads" : "Photo Curation Workspace"} />

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
              {isTeamMember ? "Upload & Review Photos" : "Photo Curation & Uploads"}
            </h1>
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Event: <strong className="text-gray-900 dark:text-white">{eventTitle}</strong> ·{" "}
              {isTeamMember
                ? "Upload your photography for this event and review your submissions."
                : "Review uploads, select approved photos, and publish customer galleries."}
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

          {isAdmin && (
            <Button
              onClick={() => setIsPublishOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <Lock className="size-4" />
              {gallerySlug ? `Update Gallery (${selectedIds.size})` : `Publish Gallery (${selectedIds.size})`}
            </Button>
          )}
        </div>
      </div>

      {/* Live Gallery & PIN Access Banner (Admin Only) */}
      {isAdmin && gallerySlug && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-purple-500/5 p-4 sm:p-5 shadow-xs dark:border-primary/30 dark:from-primary/10 dark:via-primary/15 dark:to-purple-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Customer Gallery
                </span>
                <span className="text-xs text-dark-5 dark:text-dark-6">·</span>
                <span className="text-xs text-dark-5 dark:text-dark-6 font-mono">/gallery/{gallerySlug}</span>
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Client Gallery & Access Credentials
              </h2>
              <p className="text-xs text-dark-5 dark:text-dark-6 max-w-xl">
                Share this PIN-protected link with event clients and attendees to view and download their curated photos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Access PIN Pill */}
              <div className="flex items-center gap-2 rounded-xl border border-[#EBE8E3] bg-white px-3.5 py-1.5 dark:border-white/15 dark:bg-dark-2 shadow-xs">
                <KeyRound className="size-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-dark-5">Access PIN</span>
                  <span className="font-mono text-xs font-bold tracking-widest text-primary">
                    {showPin ? galleryPin || "123456" : "••••••"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="ml-1 p-1 text-dark-5 hover:text-dark dark:hover:text-white transition"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="p-1 text-dark-5 hover:text-primary transition"
                  title="Copy PIN"
                >
                  {copiedPin ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Copy Full Invite Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyInvite}
                className="rounded-xl border-[#EBE8E3] bg-white dark:border-white/15 dark:bg-dark-2 text-xs h-9 px-3 gap-1.5 hover:border-primary hover:text-primary transition shadow-xs"
              >
                {copiedInvite ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied Invite
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5 text-primary" />
                    Copy Client Invite
                  </>
                )}
              </Button>

              {/* Copy Link Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="rounded-xl border-[#EBE8E3] bg-white dark:border-white/15 dark:bg-dark-2 text-xs h-9 px-3 gap-1.5 hover:border-primary hover:text-primary transition shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy Link
                  </>
                )}
              </Button>

              {/* Open Gallery */}
              <a
                href={`/gallery/${gallerySlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-xs transition"
              >
                <ExternalLink className="size-3.5" />
                Open Gallery
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Filter and stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EBE8E3] bg-white p-4 shadow-xs dark:border-white/15 dark:bg-gray-dark">
        {/* Tab selection */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-dark-2 rounded-xl">
          <button
            type="button"
            onClick={() => setViewTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewTab === "all"
                ? "bg-white dark:bg-dark-3 text-primary shadow-xs"
                : "text-dark-5 hover:text-dark dark:hover:text-white"
            }`}
          >
            <Layers className="size-3.5" />
            All Event Photos ({photos.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab("my_uploads")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewTab === "my_uploads"
                ? "bg-white dark:bg-dark-3 text-primary shadow-xs"
                : "text-dark-5 hover:text-dark dark:hover:text-white"
            }`}
          >
            <User className="size-3.5" />
            My Uploads ({myPhotos.length})
          </button>
        </div>

        {/* Right side stats & curation filter (Admin Only) */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-600 font-medium">
                <span>Curated for Gallery:</span>
                <strong>{selectedIds.size}</strong>
              </div>

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
                {filterSelectedOnly ? "Showing Curated Only" : "Show Curated Only"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      <PhotoGrid
        photos={displayedPhotos}
        selectedIds={selectedIds}
        isLoading={loadingPhotos}
        canSelect={isAdmin}
        canDelete={(photo) => isAdmin || isPhotoOwner(photo)}
        onToggleSelect={isAdmin ? toggleSelectPhoto : undefined}
        onDelete={handleDeletePhoto}
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

      {isAdmin && (
        <GalleryPublishModal
          open={isPublishOpen}
          onOpenChange={setIsPublishOpen}
          eventId={eventId}
          eventTitle={eventTitle}
          selectedCount={selectedIds.size}
          initialGallery={
            gallerySlug
              ? {
                  id: galleryId || eventId,
                  title: galleryTitle || `${eventTitle} - Official Gallery`,
                  slug: gallerySlug,
                  pin: galleryPin || "",
                  isPublished: true,
                }
              : null
          }
          onSuccess={({ slug, pin }) => {
            setIsPublishOpen(false);
            setGallerySlug(slug);
            setGalleryPin(pin);
            fetchEventData();
            const galleryUrl = `${window.location.origin}/gallery/${slug}`;
            // Copy to clipboard and show the credentials
            navigator.clipboard.writeText(`Gallery URL: ${galleryUrl}\nPIN: ${pin}`).catch(() => {});
            toast.success(
              `Gallery updated! URL: ${galleryUrl} · PIN: ${pin} — copied to clipboard.`,
              { duration: 8000 }
            );
          }}
        />
      )}
    </div>
  );
}

