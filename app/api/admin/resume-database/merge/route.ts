import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromS3 } from "@/lib/s3";

/**
 * POST /api/admin/resume-database/merge
 * Merges multiple duplicate resume records into one primary profile.
 * Body: { primaryId: string, duplicateIds: string[] } or { ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    let { primaryId, duplicateIds, ids } = body;

    if ((!ids || ids.length < 2) && (!primaryId || !duplicateIds || duplicateIds.length === 0)) {
      return NextResponse.json(
        { error: "At least two resume records are required to perform a merge." },
        { status: 400 }
      );
    }

    if (!primaryId && ids && ids.length >= 2) {
      primaryId = ids[0];
      duplicateIds = ids.slice(1);
    }

    // Ensure primaryId is not in duplicateIds
    duplicateIds = (duplicateIds as string[]).filter((id) => id !== primaryId);

    if (duplicateIds.length === 0) {
      return NextResponse.json(
        { error: "No distinct duplicate resumes specified to merge." },
        { status: 400 }
      );
    }

    // Fetch primary resume
    const primaryResume = await prisma.resumeDocument.findUnique({
      where: { id: primaryId },
    });

    if (!primaryResume) {
      return NextResponse.json(
        { error: "Primary resume record not found." },
        { status: 404 }
      );
    }

    // Fetch all duplicates
    const duplicates = await prisma.resumeDocument.findMany({
      where: { id: { in: duplicateIds } },
    });

    if (duplicates.length === 0) {
      return NextResponse.json(
        { error: "Duplicate resume records not found." },
        { status: 404 }
      );
    }

    // 1. Merge skills (unique union)
    const allSkillsSet = new Set<string>();
    (primaryResume.skills || []).forEach((s) => allSkillsSet.add(s.trim()));
    duplicates.forEach((dup) => {
      (dup.skills || []).forEach((s) => {
        if (s && s.trim()) allSkillsSet.add(s.trim());
      });
    });
    const mergedSkills = Array.from(allSkillsSet);

    // 2. Merge contact info and other metadata (prefer primary, fallback to duplicate if missing)
    const mergedName = primaryResume.extractedName || duplicates.find((d) => d.extractedName)?.extractedName || null;
    const mergedEmail = primaryResume.extractedEmail || duplicates.find((d) => d.extractedEmail)?.extractedEmail || null;
    const mergedPhone = primaryResume.extractedPhone || duplicates.find((d) => d.extractedPhone)?.extractedPhone || null;
    const mergedLocation = primaryResume.extractedLocation || duplicates.find((d) => d.extractedLocation)?.extractedLocation || null;
    const mergedTitle = primaryResume.currentTitle || duplicates.find((d) => d.currentTitle)?.currentTitle || null;

    // Experience: max experience years across all duplicates
    const allExp = [primaryResume.experienceYears, ...duplicates.map((d) => d.experienceYears)].filter(
      (exp): exp is number => typeof exp === "number" && !isNaN(exp)
    );
    const mergedExp = allExp.length > 0 ? Math.max(...allExp) : primaryResume.experienceYears;

    // 3. Update the primary resume with merged fields
    const updatedPrimary = await prisma.resumeDocument.update({
      where: { id: primaryId },
      data: {
        skills: mergedSkills,
        extractedName: mergedName,
        extractedEmail: mergedEmail,
        extractedPhone: mergedPhone,
        extractedLocation: mergedLocation,
        currentTitle: mergedTitle,
        experienceYears: mergedExp,
      },
    });

    // 4. Clean up duplicate S3 files
    const s3KeysToDelete = duplicates
      .map((d) => d.r2Key)
      .filter((key) => key && key.includes("/") && !key.startsWith("upload-failed") && !key.startsWith("invalid-file-type"));

    if (s3KeysToDelete.length > 0) {
      await Promise.allSettled(s3KeysToDelete.map((key) => deleteFileFromS3(key)));
    }

    // 5. Delete duplicate records from database
    const { count } = await prisma.resumeDocument.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${count} duplicate resume${count !== 1 ? "s" : ""} into primary profile (${primaryResume.extractedName || primaryResume.originalFileName}).`,
      primaryResume: updatedPrimary,
      deletedCount: count,
    });
  } catch (error) {
    console.error("[POST /api/admin/resume-database/merge]", error);
    return NextResponse.json(
      { error: "Failed to merge resumes." },
      { status: 500 }
    );
  }
}
