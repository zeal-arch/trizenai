"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  KeyRound,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Copy,
  Image as ImageIcon,
  Share2,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authFetch } from "@/lib/api-client";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  title: string;
  eventTitle: string;
  slug: string;
  pin?: string;
  photoCount: number;
  viewCount: number;
  isPublished: boolean;
  publishedAt: string;
}

export default function GalleriesPage() {
  const router = useRouter();
  const { isTeamMember, loading: authLoading } = useCurrentUser();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);

  useEffect(() => {
    if (!authLoading && isTeamMember) {
      toast.error("Access Restricted: Customer Galleries are managed by Team Admins.");
      router.replace("/admin/events");
    }
  }, [authLoading, isTeamMember, router]);

  useEffect(() => {
    if (authLoading || isTeamMember) return;

    async function loadGalleries() {
      try {
        const res = await authFetch("/api/galleries");
        if (res.ok) {
          const data = await res.json();
          if (data.galleries && data.galleries.length > 0) {
            setGalleries(
              data.galleries.map((g: any) => ({
                id: g.id,
                title: g.title,
                eventTitle: g.eventTitle || "Event Gallery",
                slug: g.slug,
                pin: g.pin,
                photoCount: g.photoCount || 0,
                viewCount: g.viewCount || 0,
                isPublished: g.isPublished,
                publishedAt: g.publishedAt ? g.publishedAt.split("T")[0] : "Recent",
              }))
            );
          }
        }
      } catch {
        // keep fallback
      }
    }
    loadGalleries();
  }, [authLoading, isTeamMember]);

  if (authLoading || isTeamMember) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const togglePinReveal = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPin = (pin: string | undefined, id: string) => {
    if (!pin) {
      toast.error("This gallery PIN is unavailable. Rotate the PIN from the event page.");
      return;
    }
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    toast.success("PIN copied to clipboard!");
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  const copyShareLink = (gallery: GalleryItem) => {
    const url = `${window.location.origin}/gallery/${gallery.slug}`;
    const text = `📸 ${gallery.title}\n🔗 Link: ${url}\n🔑 PIN: ${gallery.pin || "Rotate PIN from the event page"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(gallery.id);
    toast.success("Gallery invite text copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Customer Galleries" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Customer Galleries
          </h1>
          <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
            Manage public PIN-protected galleries shared with event attendees and customers.
          </p>
        </div>
      </div>

      {/* Empty state */}
      {galleries.length === 0 && (
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE8E3] bg-white dark:border-white/15 dark:bg-gray-dark text-center p-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Lock className="size-6" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            No published customer galleries yet
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            Navigate to an Event, curate your selected photos, and click &quot;Publish Gallery&quot; to generate your first PIN-protected client collection.
          </p>
          <Link href="/admin/events" className="mt-4">
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs px-4">
              Go to Events
            </Button>
          </Link>
        </div>
      )}

      {/* Galleries List */}
      {galleries.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {galleries.map((gallery) => {
          const isPinRevealed = !!revealedPins[gallery.id];

          return (
            <div
              key={gallery.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-white/15 dark:bg-gray-dark"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
                    <Lock className="size-5" />
                  </div>
                  <Badge variant="success" className="gap-1 font-semibold">
                    <Eye className="size-3" /> Published
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {gallery.title}
                  </h3>
                  <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
                    Event: {gallery.eventTitle}
                  </p>
                </div>

                {/* PIN Card */}
                <div className="rounded-xl border border-[#EBE8E3] dark:border-white/15 bg-gray-50/80 dark:bg-dark-2/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-5 font-medium flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-primary" /> Access PIN:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold tracking-widest text-primary">
                        {isPinRevealed ? gallery.pin || "Unavailable" : "••••••"}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinReveal(gallery.id)}
                        className="p-1 text-dark-5 hover:text-dark dark:hover:text-white transition"
                        title={isPinRevealed ? "Hide PIN" : "Reveal PIN"}
                      >
                        {isPinRevealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                      onClick={() => copyPin(gallery.pin, gallery.id)}
                        className="p-1 text-dark-5 hover:text-primary transition"
                        title="Copy PIN"
                      >
                        {copiedPinId === gallery.id ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-5 font-medium flex items-center gap-1.5">
                      <ImageIcon className="size-3.5 text-blue-500" /> Curated Photos:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {gallery.photoCount} photos
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-5 font-medium flex items-center gap-1.5">
                      <Eye className="size-3.5 text-emerald-500" /> Views:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {gallery.viewCount} views
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-[#EBE8E3] dark:border-white/15">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyShareLink(gallery)}
                  className="flex-1 h-9 rounded-xl border-[#EBE8E3] dark:border-white/15 text-xs gap-1.5 hover:border-primary hover:text-primary transition"
                >
                  {copiedId === gallery.id ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      Copied Invite
                    </>
                  ) : (
                    <>
                      <Share2 className="size-3.5" />
                      Copy Invite
                    </>
                  )}
                </Button>

                <Link href={`/gallery/${gallery.slug}`} target="_blank">
                  <Button
                    size="sm"
                    className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 shadow-xs"
                  >
                    <ExternalLink className="size-3.5" />
                    View
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
