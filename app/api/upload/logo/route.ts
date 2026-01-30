import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { uploadFileToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    await requireEmployer();

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log("[LOGO UPLOAD] Starting upload for file:", file.name);
    console.log("[LOGO UPLOAD] File size:", file.size, "bytes");
    console.log("[LOGO UPLOAD] File type:", file.type);

    const url = await uploadFileToS3(
      buffer,
      file.name,
      file.type,
      "logos" // Upload to logos folder
    );

    console.log("[LOGO UPLOAD] ✅ Upload successful, URL:", url);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[LOGO UPLOAD] ❌ Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload logo";
    return NextResponse.json(
      { 
        error: "Failed to upload logo",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

