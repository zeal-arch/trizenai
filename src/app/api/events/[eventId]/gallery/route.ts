import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/permissions/require-role";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

// GET /api/events/[eventId]/gallery - Get gallery for event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = createAdminClient();

    const { data: gallery, error } = await supabase
      .from("galleries")
      .select("*")
      .eq("eventId", eventId)
      .maybeSingle();

    if (error) throw error;

    if (!gallery) {
      return NextResponse.json({ success: true, gallery: null });
    }

    // Get count of attached photos
    const { count } = await supabase
      .from("gallery_photos")
      .select("*", { count: "exact", head: true })
      .eq("galleryId", gallery.id);

    return NextResponse.json({
      success: true,
      gallery: {
        ...gallery,
        photoCount: count || 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch gallery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events/[eventId]/gallery - Create or publish customer gallery (ADMIN ONLY)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const authResult = await requireRole(["ADMIN"], "publish customer galleries");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { eventId } = await params;
    const supabase = createAdminClient();
    const body = await req.json();

    const { title, slug, pin, isPublished = true } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    // 1. Check if gallery already exists for this event
    const { data: existingGallery } = await supabase
      .from("galleries")
      .select("id")
      .eq("eventId", eventId)
      .maybeSingle();

    let galleryId = existingGallery?.id;
    let savedGallery;

    if (galleryId) {
      // Update existing gallery
      const updates: Record<string, unknown> = {
        title: title.trim(),
        slug: cleanSlug,
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      if (pin) {
        updates.pinHash = hashPin(pin);
      }

      const { data, error } = await supabase
        .from("galleries")
        .update(updates)
        .eq("id", galleryId)
        .select()
        .single();

      if (error) throw error;
      savedGallery = data;
    } else {
      // Create new gallery
      galleryId = crypto.randomUUID();
      const newGallery = {
        id: galleryId,
        eventId,
        title: title.trim(),
        slug: cleanSlug,
        pinHash: pin ? hashPin(pin) : hashPin("123456"),
        isPublished: Boolean(isPublished),
        publishedAt: isPublished ? new Date().toISOString() : null,
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("galleries")
        .insert([newGallery])
        .select()
        .single();

      if (error) throw error;
      savedGallery = data;
    }

    // 2. Attach all selected event photos (isSelected = true) to gallery_photos
    const { data: selectedPhotos } = await supabase
      .from("photos")
      .select("id")
      .eq("eventId", eventId)
      .eq("isSelected", true);

    // Clear old gallery photos and re-insert curated ones
    await supabase.from("gallery_photos").delete().eq("galleryId", galleryId);

    if (selectedPhotos && selectedPhotos.length > 0) {
      const galleryPhotoInserts = selectedPhotos.map((p, idx) => ({
        id: crypto.randomUUID(),
        galleryId,
        photoId: p.id,
        displayOrder: idx,
        addedAt: new Date().toISOString(),
      }));

      await supabase.from("gallery_photos").insert(galleryPhotoInserts);
    }

    return NextResponse.json({
      success: true,
      gallery: savedGallery,
      curatedCount: selectedPhotos?.length || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish gallery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
