"use client";

import { useState, use } from "react";
import { Loader2 } from "lucide-react";
import { CustomerGalleryViewer } from "@/app/frontend/components/customer-gallery-viewer";
import { playfair } from "@/lib/fonts";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FE] text-brand-nearBlack px-4 py-8">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-3xl border border-[#E7EAF6] shadow-[0_10px_35px_rgba(142,148,242,0.08)] text-center animate-in fade-in duration-500">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-lavenderGrey">
          Protected Gallery
        </span>

        <h1 className={`text-2xl sm:text-3xl tracking-tight text-brand-nearBlack mt-2 mb-2 ${playfair.className}`}>
          Client <span className="italic font-normal">Access</span>
        </h1>

        <p className="text-xs text-brand-warmGray leading-relaxed font-light mb-6">
          Please enter the 6-digit security PIN provided by your event photographer.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="••••••"
              className="w-full h-12 text-center font-mono text-xl tracking-[0.4em] font-semibold text-brand-nearBlack bg-[#F8F9FE] border border-[#D6DAF0] focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl focus:outline-none transition"
              autoFocus
              required
            />

            {error && (
              <p className="mt-2 text-xs text-red-500 font-medium">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying || pin.length < 4}
            className="w-full h-11 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-primary/20"
          >
            {isVerifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Unlock Gallery</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-[#E7EAF6] text-center">
          <p className="text-[10px] text-brand-warmGray font-light">
            TrizenAI Photo Sharing Platform
          </p>
        </div>
      </div>
    </div>
  );
}
