"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Eye,
  Plus,
  ArrowRight,
  Users,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { authFetch } from "@/lib/api-client";

interface DashboardStats {
  totalEvents: number;
  totalPhotos: number;
  selectedPhotos: number;
  publishedGalleries: number;
}

interface RecentEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  coverImage?: string;
  photoCount: number;
  selectedCount: number;
  galleryPublished: boolean;
  gallerySlug?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { isTeamMember, loading: authLoading } = useCurrentUser();

  useEffect(() => {
    if (!authLoading && isTeamMember) {
      router.replace("/admin/events");
    }
  }, [authLoading, isTeamMember, router]);

  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalPhotos: 0,
    selectedPhotos: 0,
    publishedGalleries: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || isTeamMember) return;
    async function fetchDashboardData() {
      try {
        setLoadingData(true);
        const res = await authFetch("/api/events");
        if (res.ok) {
          const data = await res.json();
          const events: RecentEvent[] = (data.events || []).map((e: {
            id: string;
            title: string;
            date?: string;
            location?: string;
            coverImage?: string;
            photoCount?: number;
            selectedCount?: number;
            isPublished?: boolean;
            gallery?: { slug?: string };
          }) => ({
            id: e.id,
            title: e.title,
            date: e.date ? e.date.split("T")[0] : "",
            location: e.location,
            coverImage: e.coverImage,
            photoCount: e.photoCount || 0,
            selectedCount: e.selectedCount || 0,
            galleryPublished: e.isPublished || false,
            gallerySlug: e.gallery?.slug,
          }));

          setRecentEvents(events.slice(0, 5));
          setStats({
            totalEvents: events.length,
            totalPhotos: events.reduce((sum, e) => sum + e.photoCount, 0),
            selectedPhotos: events.reduce((sum, e) => sum + e.selectedCount, 0),
            publishedGalleries: events.filter((e) => e.galleryPublished).length,
          });
        }
      } catch {
        // keep zeros
      } finally {
        setLoadingData(false);
      }
    }
    fetchDashboardData();
  }, [authLoading, isTeamMember]);

  const quickLinks = [
    {
      title: "Create Event",
      description: "Set up a new photography event & assign team",
      href: "/admin/events/new",
      icon: Plus,
      bgClass: "bg-ios-light-blue/10 dark:bg-ios-dark-blue/20",
      iconClass: "text-ios-light-blue dark:text-ios-dark-blue group-hover:text-blue-700 dark:group-hover:text-blue-300",
    },
    {
      title: "All Events",
      description: "Browse events, review uploads, and curate photos",
      href: "/admin/events",
      icon: Calendar,
      bgClass: "bg-ios-light-indigo/10 dark:bg-ios-dark-indigo/20",
      iconClass: "text-ios-light-indigo dark:text-ios-dark-indigo group-hover:text-indigo-800 dark:group-hover:text-indigo-300",
    },
    {
      title: "Customer Galleries",
      description: "Manage published galleries and access PINs",
      href: "/admin/galleries",
      icon: Eye,
      bgClass: "bg-ios-light-purple/10 dark:bg-ios-dark-purple/20",
      iconClass: "text-ios-light-purple dark:text-ios-dark-purple group-hover:text-purple-800 dark:group-hover:text-purple-300",
    },
    {
      title: "Team Members",
      description: "Manage event photographers & staff access",
      href: "/admin/team",
      icon: Users,
      bgClass: "bg-ios-light-green/10 dark:bg-ios-dark-green/20",
      iconClass: "text-ios-light-green dark:text-ios-dark-green group-hover:text-green-700 dark:group-hover:text-green-300",
    },
  ];

  if (authLoading || isTeamMember) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Overview" />

      {/* ── Welcome Banner (Primary Color Dark-to-Light Gradient Banner) ───────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary to-[#C4C7F8] dark:from-[#6A70D6] dark:to-[#8E94F2] dark:border-white/15 px-6 py-8 shadow-md shadow-primary/10">        {/* Background subtle luminous accents */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 right-28 h-32 w-32 rounded-full bg-brand-mauve/20 blur-xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white border border-white/20 shadow-xs backdrop-blur-xs">
              <Camera className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Welcome to TrizenAI Studio
                </h2>
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-white/85 max-w-xl leading-relaxed">
                Collaborative event photo uploads, Lead curation, and secure PIN-protected customer galleries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Link href="/admin/events/new">
              <Button className="bg-white hover:bg-white/90 text-primary font-bold rounded-full px-5 py-2.5 text-xs shadow-md shadow-black/10 flex items-center gap-2 transition hover:scale-105">
                <Plus className="size-4 stroke-[2.5]" />
                New Event
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards (Compact Horizontal Style) ───────────────────────── */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Events */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#EBE8E3] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm dark:border-white/15 dark:bg-gray-dark">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ios-light-blue/10 text-ios-light-blue dark:bg-ios-dark-blue/20 dark:text-ios-dark-blue">
            <Calendar className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
              Total Events
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stats.totalEvents}
              </span>
              <span className="text-[10px] font-medium text-ios-light-blue dark:text-ios-dark-blue bg-ios-light-blue/10 dark:bg-ios-dark-blue/20 px-1.5 py-0.2 rounded-md">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Uploaded Photos */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#EBE8E3] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm dark:border-white/15 dark:bg-gray-dark">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ios-light-orange/10 text-ios-light-orange dark:bg-ios-dark-orange/20 dark:text-ios-dark-orange">
            <ImageIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
              Uploaded Photos
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stats.totalPhotos}
              </span>
              <span className="text-[10px] font-medium text-ios-light-orange dark:text-ios-dark-orange bg-ios-light-orange/10 dark:bg-ios-dark-orange/20 px-1.5 py-0.2 rounded-md">
                Cloudinary
              </span>
            </div>
          </div>
        </div>

        {/* Curated Photos */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#EBE8E3] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm dark:border-white/15 dark:bg-gray-dark">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ios-light-green/10 text-ios-light-green dark:bg-ios-dark-green/20 dark:text-ios-dark-green">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
              Curated Photos
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stats.selectedPhotos}
              </span>
              <span className="text-[10px] font-medium text-ios-light-green dark:text-ios-dark-green bg-ios-light-green/10 dark:bg-ios-dark-green/20 px-1.5 py-0.2 rounded-md">
                Selected
              </span>
            </div>
          </div>
        </div>

        {/* Customer Galleries */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#EBE8E3] bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm dark:border-white/15 dark:bg-gray-dark">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ios-light-purple/10 text-ios-light-purple dark:bg-ios-dark-purple/20 dark:text-ios-dark-purple">
            <Lock className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
              Customer Galleries
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stats.publishedGalleries}
              </span>
              <span className="text-[10px] font-medium text-ios-light-purple dark:text-ios-dark-purple bg-ios-light-purple/10 dark:bg-ios-dark-purple/20 px-1.5 py-0.2 rounded-md">
                PIN-Protected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions (RAYVOY Hover Card Style) ───────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
          Quick Actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group relative overflow-hidden rounded-xl border border-[#EBE8E3] bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md dark:border-white/15 dark:bg-gray-dark"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full shadow-xs transition-transform duration-200 group-hover:scale-105 ${link.bgClass}`}>
                    <Icon className={`size-5 transition-colors duration-200 ${link.iconClass}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary dark:text-white transition-colors">
                      {link.title}
                    </h4>
                    <p className="mt-1 text-xs text-dark-5 dark:text-dark-6 line-clamp-2">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-dark-5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Recent Events Table (RAYVOY Clean Card Style) ───────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
            Recent Event Projects
          </h3>
          <Link
            href="/admin/events"
            className="group flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View All Events
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#EBE8E3] bg-white shadow-xs dark:border-white/15 dark:bg-gray-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EBE8E3] bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 dark:border-white/15 dark:bg-dark-2">
                <tr>
                  <th className="px-5 py-3.5">Event Name</th>
                  <th className="px-5 py-3.5">Date & Venue</th>
                  <th className="px-5 py-3.5">Photos Uploaded</th>
                  <th className="px-5 py-3.5">Curation Progress</th>
                  <th className="px-5 py-3.5">Customer Gallery</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE8E3] dark:divide-white/15">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                      No events created yet. Click &quot;New Event&quot; to get started.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {event.coverImage ? (
                          <Image
                            src={event.coverImage}
                            alt={event.title}
                            width={40}
                            height={40}
                            unoptimized
                            className="size-10 rounded-lg object-cover border border-[#EBE8E3] dark:border-white/15"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-2 text-dark-5">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {event.title}
                          </p>
                          <p className="text-[11px] text-dark-5">ID: {event.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.date}</p>
                      <p className="text-[11px] text-dark-5">{event.location || "Online"}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {event.photoCount} photos
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 dark:bg-dark-2 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{
                              width: `${event.photoCount > 0 ? (event.selectedCount / event.photoCount) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-dark-5">
                          {event.selectedCount}/{event.photoCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {event.galleryPublished ? (
                        <Badge variant="success" className="gap-1">
                          <Lock className="size-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/events/${event.id}/photos`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3 rounded-lg border-[#EBE8E3] dark:border-white/15 hover:border-primary hover:text-primary transition"
                        >
                          Manage Photos
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
