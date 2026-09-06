import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToCloudinary } from "@/lib/cloudinary/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "trizenai-events";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary(buffer, folder, file.name);

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
