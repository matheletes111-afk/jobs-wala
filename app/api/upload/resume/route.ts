import { NextRequest, NextResponse } from "next/server";
import { requireJobSeeker } from "@/lib/auth-utils";
import { uploadFileToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    await requireJobSeeker();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("[RESUME UPLOAD] Starting upload for file:", file.name);
    console.log("[RESUME UPLOAD] File size:", file.size, "bytes");
    console.log("[RESUME UPLOAD] File type:", file.type);

    const url = await uploadFileToS3(
      buffer,
      file.name,
      file.type
    );

    console.log("[RESUME UPLOAD] ✅ Upload successful, URL:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[RESUME UPLOAD] ❌ Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload resume";
    return NextResponse.json(
      { 
        error: "Failed to upload resume",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

