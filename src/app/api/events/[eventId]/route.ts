import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, requireEventAccess } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/events/[eventId] - Get single event details with photos and gallery
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const accessCheck = await requireEventAccess(eventId, "view this event");
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    const supabase = createAdminClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: photos } = await supabase
      .from("photos")
      .select("*")
      .eq("eventId", eventId)
      .order("createdAt", { ascending: false });

    const { data: gallery } = await supabase
      .from("galleries")
      .select("*")
      .eq("eventId", eventId)
      .maybeSingle();

    const { data: members } = await supabase
      .from("event_members")
      .select("userId, assignedAt")
      .eq("eventId", eventId);

    const isAdmin = accessCheck.role === "ADMIN";
    const safeGallery = gallery
      ? {
          ...gallery,
          pin: isAdmin ? (gallery.pin || "123456") : undefined,
          pinHash: undefined,
        }
      : null;

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        photos: photos || [],
        photoCount: (photos || []).length,
        selectedCount: (photos || []).filter((p) => p.isSelected).length,
        gallery: safeGallery,
        members: members || [],
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch event details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/events/[eventId] - Update event details (ADMIN ONLY)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"], "update event details");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { eventId } = await params;
    const supabase = createAdminClient();
    const body = await req.json();

    const { title, description, date, location, coverImage } = body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (date !== undefined) updates.date = new Date(date).toISOString();
    if (location !== undefined) updates.location = location ? location.trim() : null;
    if (coverImage !== undefined) updates.coverImage = coverImage;

    const { data: updatedEvent, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/[eventId] - Delete event (ADMIN ONLY)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"], "delete events");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { eventId } = await params;
    const supabase = createAdminClient();

    // 1. Delete gallery photos
    const { data: gallery } = await supabase
      .from("galleries")
      .select("id")
      .eq("eventId", eventId)
      .maybeSingle();

    if (gallery) {
      await supabase.from("gallery_photos").delete().eq("galleryId", gallery.id);
      await supabase.from("galleries").delete().eq("id", gallery.id);
    }

    // 2. Delete event photos and event members
    await supabase.from("photos").delete().eq("eventId", eventId);
    await supabase.from("event_members").delete().eq("eventId", eventId);

    // 3. Delete event
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

