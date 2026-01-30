import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Custom domain or public URL (e.g., https://your-bucket.r2.dev)

// Create S3-compatible client for Cloudflare R2
const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" as region
  endpoint: R2_ACCOUNT_ID 
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "resumes"
): Promise<string> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error(
      "R2 storage not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables."
    );
  }

  // Sanitize filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

  console.log("[R2 UPLOAD] Uploading file:", key);
  console.log("[R2 UPLOAD] Bucket:", R2_BUCKET_NAME);
  console.log("[R2 UPLOAD] Content type:", contentType);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await r2Client.send(command);
    console.log("[R2 UPLOAD] ✅ File uploaded successfully:", key);

    // Return public URL if configured
    if (R2_PUBLIC_URL) {
      const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
      console.log("[R2 UPLOAD] Public URL:", publicUrl);
      return publicUrl;
    }

    // If no public URL configured, generate a signed URL for immediate access
    // Note: Signed URLs expire after 1 hour. Consider setting R2_PUBLIC_URL for permanent access.
    try {
      const signedUrl = await getSignedFileUrl(key);
      console.log("[R2 UPLOAD] Generated signed URL (expires in 1 hour)");
      return signedUrl;
    } catch (signedUrlError) {
      console.warn("[R2 UPLOAD] Could not generate signed URL, returning key:", signedUrlError);
      // Fallback: return the key (caller can use getSignedFileUrl() later)
      return key;
    }
  } catch (error) {
    console.error("[R2 UPLOAD] ❌ Upload failed:", error);
    throw error;
  }
}

export async function getSignedFileUrl(key: string): Promise<string> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function deleteFileFromS3(key: string): Promise<void> {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not configured");
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

export function extractS3KeyFromUrl(url: string): string {
  // Extract key from URL (handles both resumes/ and logos/ folders)
  const match = url.match(/(resumes|logos)\/(.+)$/);
  return match ? `${match[1]}/${match[2]}` : "";
}

