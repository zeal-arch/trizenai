"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { playfair } from "@/lib/fonts";

export default function HomePage() {
  const [gallerySlug, setGallerySlug] = useState("");
  const router = useRouter();

  const handleOpenGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (gallerySlug.trim()) {
      router.push(`/gallery/${gallerySlug.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-cream text-brand-nearBlack">
      {/* Navigation Header */}
      <header className="flex items-center justify-between px-6 sm:px-12 py-6 max-w-6xl mx-auto w-full border-b border-brand-lightGray">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-nearBlack text-white font-semibold text-xs tracking-wider">
            TZ
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-brand-nearBlack">
              TrizenAI
            </span>
            <span className="text-[10px] text-brand-warmGray uppercase tracking-widest font-medium">
              Photo Sharing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/login"
            className="px-4 py-2 rounded-full text-xs font-semibold text-brand-nearBlack hover:bg-white/80 border border-brand-lightGray transition"
          >
            Sign In
          </Link>
          <Link
            href="/admin/register"
            className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-brand-softPeriwinkle hover:opacity-90 shadow-sm transition"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        {/* Subtle Category Tag */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-lavenderGrey mb-4">
          Photo Sharing & Proofing Platform
        </span>

        {/* Editorial Headline */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl tracking-tight text-brand-nearBlack max-w-3xl leading-[1.18] ${playfair.className}`}
        >
          Collaborative Event Photos,{" "}
          <span className="italic font-normal text-brand-softPeriwinkle">
            Delivered Securely.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-brand-warmGray max-w-xl leading-relaxed font-light">
          Photography teams collaborate and batch upload high-resolution shots.
          Admins curate selections and publish private customer galleries protected with PINs.
        </p>

        {/* Customer Gallery Access Card */}
        <div className="mt-10 w-full max-w-md bg-white p-5 rounded-2xl border border-brand-lightGray shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left">
          <label
            htmlFor="gallerySlug"
            className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-lavenderGrey mb-2"
          >
            Have a Gallery Link?
          </label>
          <form onSubmit={handleOpenGallery} className="flex gap-2">
            <input
              id="gallerySlug"
              type="text"
              value={gallerySlug}
              onChange={(e) => setGallerySlug(e.target.value)}
              placeholder="e.g. arjun-priya-wedding or gala-2026"
              className="flex-1 h-11 px-3.5 rounded-xl border border-brand-lightGray bg-brand-cream/60 text-xs text-brand-nearBlack placeholder:text-brand-warmGray/60 focus:outline-none focus:border-brand-softPeriwinkle focus:bg-white transition"
              required
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-brand-nearBlack hover:bg-brand-nearBlack/90 text-white shrink-0 text-xs font-semibold transition cursor-pointer"
            >
              Open
            </button>
          </form>
        </div>

        {/* Three Roles Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full">
          {/* Admin */}
          <div className="p-6 rounded-2xl border border-brand-lightGray bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-softPeriwinkle">
                Role 01
              </span>
              <h3 className="font-semibold text-sm text-brand-nearBlack mt-1.5">
                Admin / Lead
              </h3>
              <p className="text-xs text-brand-warmGray mt-2 leading-relaxed font-light">
                Create events, assign photographers, review team uploads, select photos, and publish PIN-protected client galleries.
              </p>
            </div>
          </div>

          {/* Team Member */}
          <div className="p-6 rounded-2xl border border-brand-lightGray bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-softPeriwinkle">
                Role 02
              </span>
              <h3 className="font-semibold text-sm text-brand-nearBlack mt-1.5">
                Team Member
              </h3>
              <p className="text-xs text-brand-warmGray mt-2 leading-relaxed font-light">
                Sign in to view assigned events, batch upload raw event photography, and manage personal submissions.
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="p-6 rounded-2xl border border-brand-lightGray bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-softPeriwinkle">
                Role 03
              </span>
              <h3 className="font-semibold text-sm text-brand-nearBlack mt-1.5">
                Customer (No Account)
              </h3>
              <p className="text-xs text-brand-warmGray mt-2 leading-relaxed font-light">
                Open the shareable gallery link, enter your 6-digit access PIN, and browse curated photos in full resolution.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-lightGray py-6 text-center text-xs text-brand-warmGray">
        <p className="font-light">
          TrizenAI Full-Stack Internship Challenge • Built with Next.js, Prisma, Supabase & Cloudinary
        </p>
      </footer>
    </div>
  );
}
