"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  Users,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Badge } from "@/components/badge";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  coverImage?: string;
  photoCount: number;
  selectedCount: number;
  teamCount: number;
  galleryPublished: boolean;
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: "00000000-0000-0000-0000-000000000001",
      title: "TrizenAI Annual Gala 2026",
      description: "Annual leadership gala, keynote showcases, and team awards night.",
      date: "2026-09-15",
      location: "The Grand Ballroom, Bangalore",
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      photoCount: 68,
      selectedCount: 28,
      teamCount: 4,
      galleryPublished: true,
    },
  ]);
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) {
            setEvents(
              data.events.map((e: { id: string; title: string; description?: string; date?: string; location?: string; coverImage?: string; photoCount?: number; selectedCount?: number; isPublished?: boolean }) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                date: e.date ? e.date.split("T")[0] : "2026-09-15",
                location: e.location || "Studio Venue",
                coverImage: e.coverImage || "/image/cover/cover-01.png",
                photoCount: e.photoCount || 0,
                selectedCount: e.selectedCount || 0,
                teamCount: 2,
                galleryPublished: e.isPublished || false,
              }))
            );
          }
        }
      } catch {
        // use fallback initial events
      }
    }
    loadEvents();
  }, []);

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Events" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Event Management
          </h1>
          <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
            Create and manage photography projects, assign team members, and curate galleries.
          </p>
        </div>

        <Link href="/admin/events/new">
          <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2">
            <Plus className="size-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search events by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-dark border-[#EBE8E3] dark:border-white/15 rounded-xl text-xs h-10"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-5" />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#EBE8E3] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg dark:border-white/15 dark:bg-gray-dark"
          >
            {/* Event Cover Image */}
            <div className="relative h-44 w-full overflow-hidden bg-gray-100 dark:bg-dark-2">
              {event.coverImage ? (
                <Image
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-dark-5">
                  <ImageIcon className="size-10 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                {event.galleryPublished ? (
                  <Badge variant="success" className="gap-1 backdrop-blur-md bg-emerald-600/90 text-white border-none shadow-xs">
                    <Lock className="size-3" /> Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="backdrop-blur-md bg-black/60 text-white border-none shadow-xs">
                    Draft
                  </Badge>
                )}
              </div>

              {/* Title on cover */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="font-bold text-base text-white line-clamp-1 drop-shadow-sm">
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5 text-primary" /> {event.date}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="size-3.5 text-primary" /> {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
              <p className="text-xs text-dark-5 dark:text-dark-6 line-clamp-2">
                {event.description || "No description provided."}
              </p>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-2 border-y border-[#EBE8E3] dark:border-white/15 py-3 text-center">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-dark-5">Photos</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {event.photoCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-dark-5">Selected</p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {event.selectedCount}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-dark-5">Team</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {event.teamCount}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Link href={`/admin/events/${event.id}/photos`} className="flex-1">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-xs h-9 flex items-center justify-center gap-1.5 shadow-xs">
                    <ImageIcon className="size-3.5" />
                    Manage Photos
                  </Button>
                </Link>
                <Link href={`/admin/events/${event.id}/team`}>
                  <Button variant="outline" size="icon" className="size-9 rounded-xl border-[#EBE8E3] dark:border-white/15 hover:border-primary hover:text-primary">
                    <Users className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
