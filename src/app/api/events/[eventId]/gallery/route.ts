import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventAccess, requireEventRole } from "@/lib/permissions/require-role";
import crypto from "crypto";
import {
  decryptGalleryPin,
  encryptGalleryPin,
  hashGalleryPin,
  isValidGalleryPin,
} from "@/lib/security/gallery-pin";

export const dynamic = "force-dynamic";

// GET /api/events/[eventId]/gallery - Get gallery for event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = createAdminClient();
    const accessCheck = await requireEventAccess(eventId, "view this gallery");
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    const isLead = accessCheck.eventRole === "LEAD";

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

    // Only expose PIN to Admin
    const safeGallery = {
      ...gallery,
      pin: isLead ? decryptGalleryPin(gallery.pin) : undefined,
      pinHash: undefined,
      photoCount: count || 0,
    };

    return NextResponse.json({
      success: true,
      gallery: safeGallery,
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
    const { eventId } = await params;
    const authResult = await requireEventRole(eventId, ["LEAD"], "publish customer galleries");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

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

    const rawPin = pin === undefined || pin === null || pin === "" ? undefined : String(pin).trim();

    if (rawPin !== undefined && !isValidGalleryPin(rawPin)) {
      return NextResponse.json({ error: "PIN must contain 4 to 6 digits." }, { status: 400 });
    }

    // 1. Check if gallery already exists for this event
    const { data: existingGallery } = await supabase
      .from("galleries")
      .select("id, pin")
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

      if (rawPin) {
        updates.pin = encryptGalleryPin(rawPin);
        updates.pinHash = hashGalleryPin(rawPin);
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
      if (!rawPin) {
        return NextResponse.json({ error: "A 4 to 6 digit PIN is required for a new gallery." }, { status: 400 });
      }

      const finalPin = rawPin;
      const newGallery = {
        id: galleryId,
        eventId,
        title: title.trim(),
        slug: cleanSlug,
        pin: encryptGalleryPin(finalPin),
        pinHash: hashGalleryPin(finalPin),
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
      gallery: {
        ...savedGallery,
        pin: rawPin,
        pinHash: undefined,
      },
      curatedCount: selectedPhotos?.length || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish gallery";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
