"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/dialog";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { KeyRound, Share2, Copy, Check, RefreshCw, Loader2, Globe, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface GalleryPublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  selectedCount: number;
  initialGallery?: {
    id: string;
    title: string;
    slug: string;
    pin?: string;
    isPublished: boolean;
  } | null;
  onSuccess: (galleryData: { id: string; slug: string; pin: string }) => void;
}

export function GalleryPublishModal({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  selectedCount,
  initialGallery,
  onSuccess,
}: GalleryPublishModalProps) {
  const [title, setTitle] = useState(initialGallery?.title || `${eventTitle} - Official Gallery`);
  const [pin, setPin] = useState(initialGallery?.pin || "");
  const [slug, setSlug] = useState(initialGallery?.slug || eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedCredentials, setPublishedCredentials] = useState<{
    url: string;
    pin: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialGallery) {
        setTitle(initialGallery.title || `${eventTitle} - Official Gallery`);
        setSlug(initialGallery.slug || eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        if (initialGallery.pin) {
          setPin(initialGallery.pin);
        }
      } else {
        setTitle(`${eventTitle} - Official Gallery`);
        setSlug(eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        setPin("123456");
      }
      setPublishedCredentials(null);
    }
  }, [open, initialGallery, eventTitle]);

  const generateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setPin(randomPin);
    setShowPin(true);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || (!initialGallery && pin.length < 4)) {
      toast.error("Please provide a title and at least a 4-digit PIN.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/events/${eventId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          pin,
          isPublished: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish gallery.");
      }

      const result = await response.json();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const galleryUrl = `${origin}/gallery/${result.gallery.slug || slug}`;

      setPublishedCredentials({
        url: galleryUrl,
        pin: pin || "Existing PIN",
      });

      toast.success("Gallery published successfully!");
      onSuccess({ id: result.gallery.id, slug: result.gallery.slug, pin });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error publishing gallery";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!publishedCredentials) return;
    const text = `📸 Access your photo gallery for ${eventTitle}:\n🔗 Link: ${publishedCredentials.url}\n🔑 PIN: ${publishedCredentials.pin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Gallery link & PIN copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-dark-2 rounded-2xl border border-[#EBE8E3] dark:border-white/15 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            <span>Publish Customer Gallery</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Publish a customer-facing photo gallery protected by an access PIN.
          </DialogDescription>
        </DialogHeader>

        {publishedCredentials ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <Check className="size-4" />
                <span>Gallery Live & Protected</span>
              </div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Share these access credentials with the customer:
              </p>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="bg-white dark:bg-dark-3 p-2.5 rounded-lg border border-[#EBE8E3] dark:border-white/15 flex items-center justify-between">
                  <span className="text-gray-500">URL:</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-[240px]">
                    {publishedCredentials.url}
                  </span>
                </div>
                <div className="bg-white dark:bg-dark-3 p-2.5 rounded-lg border border-[#EBE8E3] dark:border-white/15 flex items-center justify-between">
                  <span className="text-gray-500">Access PIN:</span>
                  <span className="font-bold text-primary tracking-wider">
                    {publishedCredentials.pin}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={copyToClipboard}
                className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                <span>{copied ? "Copied Credentials" : "Copy Link & PIN"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="mt-4 space-y-4">
            {/* Stat Summary Box */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20">
              <span className="text-xs text-gray-600 dark:text-gray-300">Selected Photos for Publishing</span>
              <span className="text-sm font-bold text-primary">
                {selectedCount} photos
              </span>
            </div>

            {/* Gallery Title */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-title" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Gallery Title
              </Label>
              <Input
                id="gallery-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Arjun & Priya Wedding"
                required
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="gallery-slug" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Custom URL Identifier (Slug)
              </Label>
              <Input
                id="gallery-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                placeholder="arjun-priya-wedding"
                required
              />
            </div>

            {/* Access PIN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gallery-pin" className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-indigo-600" />
                  <span>Access PIN (4-6 digits)</span>
                </Label>
                <button
                  type="button"
                  onClick={generateRandomPin}
                  className="text-[11px] text-primary dark:text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RefreshCw className="size-3" />
                  <span>Generate New</span>
                </button>
              </div>
              <div className="relative">
                <Input
                  id="gallery-pin"
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={initialGallery?.pin || "e.g. 482917"}
                  className="tracking-widest font-mono text-sm pr-10"
                  required={!initialGallery}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {initialGallery?.pin
                  ? `Saved PIN: ${showPin ? initialGallery.pin : "••••••"} (stored in Supabase database; change only if needed).`
                  : "This PIN will be stored in Supabase and required for client access."}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#EBE8E3] dark:border-white/15 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-[#EBE8E3] dark:border-white/15"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedCount === 0}
                className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-4" />
                    <span>Publish & Generate Link</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
