"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Shield, ArrowRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";

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
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background ambient gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full border-b border-border/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-600/20 font-bold text-sm">
            TZ
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-gray-900 dark:text-white">TrizenAI</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Photo Sharing</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/login">
            <Button variant="outline" size="sm" className="rounded-xl font-medium">
              Admin / Team Sign In
            </Button>
          </Link>
          <Link href="/admin/register">
            <Button size="sm" className="rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
              Create Account
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6">
          <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
          <span>Full-Stack Photo Sharing & PIN-Gated Delivery</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white max-w-3xl leading-[1.15]">
          Collaborative Event Photos,{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
            Delivered Securely.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Photography teams collaborate and batch upload high-resolution event shots.
          Admins curate selections and publish private customer galleries protected with access PINs.
        </p>

        {/* Customer Gallery Quick Access Form */}
        <div className="mt-10 w-full max-w-md bg-white dark:bg-dark-2 p-5 rounded-3xl border border-border shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 text-left mb-3 flex items-center gap-1.5">
            <KeyRound className="size-3.5 text-indigo-600" />
            <span>Have a Gallery Link?</span>
          </p>
          <form onSubmit={handleOpenGallery} className="flex gap-2">
            <Input
              type="text"
              value={gallerySlug}
              onChange={(e) => setGallerySlug(e.target.value)}
              placeholder="e.g. arjun-priya-wedding"
              className="h-11 rounded-xl text-xs"
              required
            />
            <Button
              type="submit"
              className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>Open</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </form>
        </div>

        {/* Three Roles Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          {/* Admin */}
          <div className="p-6 rounded-3xl border border-border bg-white/70 dark:bg-dark-2/70 backdrop-blur-sm shadow-xs">
            <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center mb-4">
              <Shield className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Admin / Lead</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Create events, assign photographers, review all uploads, select favorites, and publish PIN-protected galleries.
            </p>
          </div>

          {/* Team Member */}
          <div className="p-6 rounded-3xl border border-border bg-white/70 dark:bg-dark-2/70 backdrop-blur-sm shadow-xs">
            <div className="size-10 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center mb-4">
              <Camera className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Team Member</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Log in to view assigned events, drag-and-drop batch upload raw photos with progress tracking.
            </p>
          </div>

          {/* Customer */}
          <div className="p-6 rounded-3xl border border-border bg-white/70 dark:bg-dark-2/70 backdrop-blur-sm shadow-xs">
            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-4">
              <ImageIcon className="size-5" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Customer (No Account)</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Open the shareable gallery link, enter your secret 6-digit PIN, and view curated photos in high resolution.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-6 text-center text-xs text-gray-500">
        <p>TrizenAI Full-Stack Internship Challenge • Built with Next.js, Prisma, Supabase & Cloudinary</p>
      </footer>
    </div>
  );
}
