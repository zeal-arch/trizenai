import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

// POST /api/gallery/[galleryId]/access - Customer PIN verification & gallery access
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId } = await params;
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: "Access PIN is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Find gallery by ID or Slug
    const { data: galleryById, error } = await supabase
      .from("galleries")
      .select("*")
      .eq("id", galleryId)
      .maybeSingle();

    let gallery = galleryById;
    if (!gallery) {
      const { data: galleryBySlug } = await supabase
        .from("galleries")
        .select("*")
        .eq("slug", galleryId)
        .maybeSingle();

      gallery = galleryBySlug;
    }

    if (error || !gallery) {
      return NextResponse.json({ error: "Gallery not found or unavailable." }, { status: 404 });
    }

    if (!gallery.isPublished) {
      return NextResponse.json(
        { error: "This gallery has not been published yet." },
        { status: 403 }
      );
    }

    // 2. Verify PIN
    const enteredPinHash = hashPin(pin);
    if (gallery.pinHash !== enteredPinHash) {
      return NextResponse.json(
        { error: "Invalid PIN. Please verify with the event host." },
        { status: 401 }
      );
    }

    // 3. Increment view count
    await supabase
      .from("galleries")
      .update({ viewCount: (gallery.viewCount || 0) + 1 })
      .eq("id", gallery.id);

    // 4. Fetch attached curated photos
    const { data: galleryPhotos } = await supabase
      .from("gallery_photos")
      .select("photoId, displayOrder")
      .eq("galleryId", gallery.id)
      .order("displayOrder", { ascending: true });

    let photoList: unknown[] = [];
    if (galleryPhotos && galleryPhotos.length > 0) {
      const photoIds = galleryPhotos.map((gp) => gp.photoId);
      const { data: photos } = await supabase
        .from("photos")
        .select("id, url, secureUrl, thumbnailUrl, filename, width, height, tags, createdAt")
        .in("id", photoIds);

      // Preserve display order
      const photoMap = new Map((photos || []).map((p) => [p.id, p]));
      photoList = galleryPhotos
        .map((gp) => photoMap.get(gp.photoId))
        .filter(Boolean);
    } else {
      // Fallback: If gallery_photos not populated yet, return selected photos from event
      const { data: selectedPhotos } = await supabase
        .from("photos")
        .select("id, url, secureUrl, thumbnailUrl, filename, width, height, tags, createdAt")
        .eq("eventId", gallery.eventId)
        .eq("isSelected", true);

      photoList = selectedPhotos || [];
    }

    // 5. Fetch Event Title
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", gallery.eventId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        eventTitle: event?.title || gallery.title,
        publishedAt: gallery.publishedAt || gallery.createdAt,
        photos: photoList,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error verifying gallery access";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
