"use client";

import { useState, use } from "react";
import { KeyRound, Loader2, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { CustomerGalleryViewer } from "@/app/frontend/components/customer-gallery-viewer";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  width?: number;
  height?: number;
}

interface GalleryData {
  id: string;
  title: string;
  eventTitle?: string;
  publishedAt?: string;
  photos: Photo[];
}

export default function PublicGalleryPage({
  params,
}: {
  params: Promise<{ galleryId: string }>;
}) {
  const { galleryId } = use(params);
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryData | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/gallery/${galleryId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Incorrect PIN or gallery unavailable.");
      }

      setGallery(data.gallery);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid access PIN.";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (gallery) {
    return (
      <CustomerGalleryViewer
        title={gallery.title}
        eventTitle={gallery.eventTitle}
        publishedAt={gallery.publishedAt}
        photos={gallery.photos}
        onLockGallery={() => setGallery(null)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0E0E10] px-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#16161A]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-600/20">
            <Lock className="size-7" />
          </div>

          <h1 className="mt-5 text-xl font-bold tracking-tight text-white">
            Private Customer Gallery
          </h1>
          <p className="mt-2 text-xs text-gray-400 max-w-xs">
            This photo gallery is protected. Please enter your 6-digit access PIN provided by the event team.
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Enter 6-digit PIN"
                className="h-13 text-center font-mono text-2xl tracking-[0.4em] font-bold text-white bg-black/40 border-white/10 focus:border-indigo-500 rounded-xl"
                autoFocus
                required
              />
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500" />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-xl">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isVerifying || pin.length < 4}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Unlock Gallery</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-500">
            Powered by <span className="font-semibold text-gray-400">TrizenAI Photo Sharing</span>
          </p>
        </div>
      </div>
    </div>
  );
}
