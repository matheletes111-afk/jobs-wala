import { NextRequest, NextResponse } from "next/server";
import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";
import { sendApplicationNotificationEmail } from "@/lib/email";

const updateSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireEmployer();
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Verify the application belongs to employer's job
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            employer: true,
          },
        },
        jobSeeker: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (application.job.employer.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status: data.status },
    });

    // Send notification email
    if (application.jobSeeker.user.email) {
      await sendApplicationNotificationEmail({
        to: application.jobSeeker.user.email,
        jobTitle: application.job.title,
        companyName: application.job.employer.companyName,
        status: data.status,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Application update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

