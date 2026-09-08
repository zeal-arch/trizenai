import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentUserOrNull } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/events - Retrieve events (filtered for TEAM_MEMBER to assigned only)
export async function GET() {
  try {
    const supabase = createAdminClient();
    const currentUser = await getCurrentUserOrNull();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized: Authentication required." }, { status: 401 });
    }

    let assignedEventIds: string[] | null = null;

    // If the authenticated user is a TEAM_MEMBER, filter to only assigned events
    if (currentUser && currentUser.role === "TEAM_MEMBER") {
      const userIds = [currentUser.user.id, currentUser.user.authId].filter(Boolean) as string[];
      const { data: memberRecords, error: memberErr } = await supabase
        .from("event_members")
        .select("eventId")
        .in("userId", userIds);

      if (memberErr) {
        throw memberErr;
      }

      assignedEventIds = (memberRecords || []).map((m) => m.eventId);

      // If team member is not assigned to any events, return empty list
      if (assignedEventIds.length === 0) {
        return NextResponse.json({
          success: true,
          events: [],
          role: currentUser.role,
        });
      }
    }

    // 1. Fetch events (filtered if team member)
    let query = supabase
      .from("events")
      .select("*")
      .order("createdAt", { ascending: false });

    if (assignedEventIds !== null) {
      query = query.in("id", assignedEventIds);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      throw eventsError;
    }

    // 2. Fetch photo counts and curation counts per event
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, eventId, isSelected, uploadedBy");

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

    // 4. Fetch event member counts
    const { data: eventMembers } = await supabase
      .from("event_members")
      .select("eventId");

    const currentAllowedIds = currentUser
      ? new Set([currentUser.user.id, currentUser.user.authId].filter(Boolean))
      : new Set();

    // Combine event data with aggregates
    const formattedEvents = (events || []).map((event) => {
      const eventPhotos = (photos || []).filter((p) => p.eventId === event.id);
      const totalPhotos = eventPhotos.length;
      const selectedPhotos = eventPhotos.filter((p) => p.isSelected).length;
      const myPhotos = currentUser
        ? eventPhotos.filter((p) => p.uploadedBy && currentAllowedIds.has(p.uploadedBy)).length
        : 0;
      const teamCount = (eventMembers || []).filter((m) => m.eventId === event.id).length;
      const gallery = (galleries || []).find((g) => g.eventId === event.id);

      return {
        ...event,
        photoCount: totalPhotos,
        selectedCount: selectedPhotos,
        myPhotoCount: myPhotos,
        teamCount: teamCount || 1,
        gallery: gallery || null,
        isPublished: gallery?.isPublished || false,
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      role: currentUser.role,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events - Create a new event (ADMIN ONLY)
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN"], "create new events");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { title, description, date, location, coverImage } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const creatorId = authResult.user.id;
    const eventId = crypto.randomUUID();
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

    // Automatically assign the admin creator to the event
    await supabase.from("event_members").insert([
      {
        id: crypto.randomUUID(),
        eventId: eventId,
        userId: creatorId,
        assignedAt: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      event: data,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
