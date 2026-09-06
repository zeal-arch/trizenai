import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/events/[eventId]/photos - List all photos for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(req.url);
    const selectedOnly = searchParams.get("selected") === "true";

    const supabase = createAdminClient();

    let query = supabase
      .from("photos")
      .select("*")
      .eq("eventId", eventId)
      .order("createdAt", { ascending: false });

    if (selectedOnly) {
      query = query.eq("isSelected", true);
    }

    const { data: photos, error } = await query;

    if (error) throw error;

    // Fetch user details for uploaders
    const uploaderIds = Array.from(new Set((photos || []).map((p) => p.uploadedBy)));
    const { data: users } = await supabase
      .from("users")
      .select("id, fullName, avatarUrl, email")
      .in("id", uploaderIds);

    const userMap = new Map((users || []).map((u) => [u.id, u]));

    const formattedPhotos = (photos || []).map((photo) => ({
      ...photo,
      uploader: userMap.get(photo.uploadedBy) || {
        id: photo.uploadedBy,
        fullName: "Team Member",
        avatarUrl: "/image/user/user-01.png",
      },
    }));

    return NextResponse.json({
      success: true,
      photos: formattedPhotos,
      totalCount: (photos || []).length,
      selectedCount: (photos || []).filter((p) => p.isSelected).length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch event photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events/[eventId]/photos - Save uploaded photo metadata to database
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const supabase = createAdminClient();

    const {
      photos, // Array of photos or single photo
      uploadedBy,
    } = body;

    const rawPhotos = Array.isArray(photos) ? photos : [body];

    if (!rawPhotos || rawPhotos.length === 0) {
      return NextResponse.json({ error: "No photo metadata provided" }, { status: 400 });
    }

    let defaultUploader = uploadedBy;
    if (!defaultUploader) {
      const { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();
      defaultUploader = user?.id || "admin-system";
    }

    const photoInserts = rawPhotos.map((p) => {
      const photoId = p.id || `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: photoId,
        eventId,
        uploadedBy: p.uploadedBy || defaultUploader,
        publicId: p.publicId || photoId,
        url: p.url || p.secureUrl,
        secureUrl: p.secureUrl || p.url,
        thumbnailUrl: p.thumbnailUrl || p.secureUrl || p.url,
        filename: p.filename || "untitled.jpg",
        fileSize: Number(p.fileSize || p.bytes || 0),
        width: p.width ? Number(p.width) : null,
        height: p.height ? Number(p.height) : null,
        isSelected: p.isSelected ?? false,
        tags: Array.isArray(p.tags) ? p.tags : [],
        createdAt: p.createdAt || new Date().toISOString(),
      };
    });

    const { data: insertedPhotos, error } = await supabase
      .from("photos")
      .insert(photoInserts)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      photos: insertedPhotos,
      count: (insertedPhotos || []).length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save photo metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/events/[eventId]/photos - Toggle curation selection (isSelected)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = createAdminClient();
    const body = await req.json();

    const { photoIds, isSelected, selectAll, deselectAll } = body;

    if (selectAll) {
      const { error } = await supabase
        .from("photos")
        .update({ isSelected: true })
        .eq("eventId", eventId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "All photos selected for gallery" });
    }

    if (deselectAll) {
      const { error } = await supabase
        .from("photos")
        .update({ isSelected: false })
        .eq("eventId", eventId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "All photos deselected" });
    }

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "photoIds array is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("photos")
      .update({ isSelected: Boolean(isSelected) })
      .in("id", photoIds)
      .eq("eventId", eventId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Updated curation status for ${photoIds.length} photo(s)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update photo curation status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]/photos - Delete photos from event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = createAdminClient();
    const body = await req.json();
    const { photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "photoIds array is required" }, { status: 400 });
    }

    // Delete gallery photo links first
    await supabase.from("gallery_photos").delete().in("photoId", photoIds);

    // Delete photos from table
    const { error } = await supabase
      .from("photos")
      .delete()
      .in("id", photoIds)
      .eq("eventId", eventId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Deleted ${photoIds.length} photo(s)`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete photos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
