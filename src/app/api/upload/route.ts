import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToCloudinary } from "@/lib/cloudinary/server";
import { requireEventAccess, requireRole } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "TEAM_MEMBER"], "upload photos to storage");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const eventId = formData.get("eventId");

    if (typeof eventId !== "string" || !eventId.trim()) {
      return NextResponse.json({ error: "eventId is required for photo uploads." }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(eventId)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const eventAccess = await requireEventAccess(eventId, "upload photos to this event");
    if (eventAccess instanceof NextResponse) {
      return eventAccess;
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate mime type and file size (max 15MB)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Supported formats: JPEG, PNG, WebP." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 15MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary(buffer, `trizenai-events/${eventId}`, file.name);

    return NextResponse.json({
      success: true,
      asset: {
        publicId: result.publicId,
        url: result.url,
        secureUrl: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        filename: file.name,
        fileSize: result.bytes || file.size,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upload file to Cloudinary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
