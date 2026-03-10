import { NextRequest, NextResponse } from "next/server";
import { requireJobSeeker } from "@/lib/auth-utils";
import { uploadFileToS3 } from "@/lib/s3";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function POST(req: NextRequest) {
  try {
    await requireJobSeeker();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and image files (JPEG, PNG, WebP, GIF) are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadFileToS3(
      buffer,
      file.name,
      file.type,
      "certificates"
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[CERTIFICATE UPLOAD] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: "Failed to upload certificate", details: errorMessage },
      { status: 500 }
    );
  }
}
