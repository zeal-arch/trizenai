import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/events - Retrieve all events with photo and gallery counts
export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch events
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .order("createdAt", { ascending: false });

    if (eventsError) {
      throw eventsError;
    }

    // 2. Fetch photo counts and curation counts per event
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, eventId, isSelected");

    if (photosError) {
      throw photosError;
    }

    // 3. Fetch galleries to get published status and slug
    const { data: galleries, error: galleriesError } = await supabase
      .from("galleries")
      .select("id, eventId, slug, isPublished");

    if (galleriesError) {
      throw galleriesError;
    }

    // Combine event data with aggregates
    const formattedEvents = (events || []).map((event) => {
      const eventPhotos = (photos || []).filter((p) => p.eventId === event.id);
      const totalPhotos = eventPhotos.length;
      const selectedPhotos = eventPhotos.filter((p) => p.isSelected).length;
      const gallery = (galleries || []).find((g) => g.eventId === event.id);

      return {
        ...event,
        photoCount: totalPhotos,
        selectedCount: selectedPhotos,
        gallery: gallery || null,
        isPublished: gallery?.isPublished || false,
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { title, description, date, location, coverImage, createdBy } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Default creator if not provided
    let creatorId = createdBy;
    if (!creatorId) {
      const { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();
      creatorId = user?.id || "admin-system";
    }

    const eventId = `event-${Date.now()}`;
    const newEvent = {
      id: eventId,
      title: title.trim(),
      description: description?.trim() || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      location: location?.trim() || null,
      coverImage: coverImage || "/image/cover/cover-01.png",
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("events")
      .insert([newEvent])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      event: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
