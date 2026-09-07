import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/galleries - List all customer galleries for admin dashboard (ADMIN ONLY)
export async function GET() {
  try {
    const authResult = await requireRole(["ADMIN"], "view customer galleries");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();

    // 1. Fetch galleries
    const { data: galleries, error: galleriesError } = await supabase
      .from("galleries")
      .select("*")
      .order("createdAt", { ascending: false });

    if (galleriesError) throw galleriesError;

    // 2. Fetch associated events
    const eventIds = Array.from(new Set((galleries || []).map((g) => g.eventId)));
    const { data: events } = await supabase
      .from("events")
      .select("id, title, date, location, coverImage")
      .in("id", eventIds);

    const eventMap = new Map((events || []).map((e) => [e.id, e]));

    // 3. Fetch curated photo count per gallery
    const { data: galleryPhotos } = await supabase
      .from("gallery_photos")
      .select("galleryId");

    const formattedGalleries = (galleries || []).map((gallery) => {
      const event = eventMap.get(gallery.eventId);
      const photoCount = (galleryPhotos || []).filter((gp) => gp.galleryId === gallery.id).length;

      return {
        id: gallery.id,
        eventId: gallery.eventId,
        title: gallery.title,
        slug: gallery.slug,
        pin: gallery.pin || "123456",
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt || gallery.createdAt,
        viewCount: gallery.viewCount || 0,
        photoCount,
        eventTitle: event?.title || "Event",
        eventDate: event?.date || gallery.createdAt,
        eventLocation: event?.location || "Studio",
        coverImage: event?.coverImage || "/image/cover/cover-01.png",
      };
    });

    return NextResponse.json({
      success: true,
      galleries: formattedGalleries,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch galleries";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
