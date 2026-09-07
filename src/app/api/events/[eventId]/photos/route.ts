import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, getCurrentUserOrNull, requireEventAccess } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/events/[eventId]/photos - List all photos for an event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const accessCheck = await requireEventAccess(eventId, "view photos for this event");
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

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
    const accessCheck = await requireEventAccess(eventId, "upload photos to this event");
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    const body = await req.json();
    const supabase = createAdminClient();
    const currentUser = accessCheck;

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
      defaultUploader = currentUser?.user.id;
    }
    if (!defaultUploader) {
      const { data: user } = await supabase.from("users").select("id").limit(1).maybeSingle();
      defaultUploader = user?.id || "admin-system";
    }

    const photoInserts = rawPhotos.map((p) => {
      const photoId = p.id || crypto.randomUUID();
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

// PATCH /api/events/[eventId]/photos - Toggle curation selection (ADMIN ONLY)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"], "curate photos for customer galleries");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

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

// DELETE /api/events/[eventId]/photos - Delete photos from event (Admins can delete all; Members only own uploads)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const accessCheck = await requireEventAccess(eventId, "delete photos from this event");
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    const supabase = createAdminClient();
    const currentUser = accessCheck;

    const body = await req.json();
    const { photoIds } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: "photoIds array is required" }, { status: 400 });
    }


    // If caller is TEAM_MEMBER, verify all requested photos were uploaded by this member
    if (currentUser.role === "TEAM_MEMBER") {
      const { data: targetPhotos, error: fetchErr } = await supabase
        .from("photos")
        .select("id, uploadedBy")
        .in("id", photoIds)
        .eq("eventId", eventId);

      if (fetchErr) throw fetchErr;

      if (!targetPhotos || targetPhotos.length === 0) {
        return NextResponse.json(
          { error: "No matching photos found in this event to delete." },
          { status: 404 }
        );
      }

      const allowedIds = new Set(
        [currentUser.user.id, (currentUser.user as { authId?: string }).authId].filter(Boolean)
      );

      const unauthorized = targetPhotos.some(
        (p) => !p.uploadedBy || !allowedIds.has(p.uploadedBy)
      );

      if (unauthorized) {
        return NextResponse.json(
          { error: "Forbidden: Team Members can only delete photos they uploaded themselves." },
          { status: 403 }
        );
      }
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

