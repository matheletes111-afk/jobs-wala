import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users/[id]
 * Returns full user with job seeker or employer profile for admin detail view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (e) {
    console.error("[GET /api/admin/users/[id]]", e);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Body: { resumeSearchEnabled?: boolean, approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as { 
      resumeSearchEnabled?: boolean; 
      approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
      rejectionReason?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id },
      select: { role: true, employerProfile: { select: { id: true, approvalStatus: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role !== "EMPLOYER" || !user.employerProfile) {
      return NextResponse.json(
        { error: "This operation can only be performed for employers." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.resumeSearchEnabled === "boolean") {
      updateData.resumeSearchEnabled = body.resumeSearchEnabled;
    }

    if (body.approvalStatus) {
      updateData.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === "REJECTED") {
        updateData.rejectionReason = body.rejectionReason || "No reason provided by the administrator.";
      } else {
        updateData.rejectionReason = null;
      }
    }

    const updated = await prisma.employerProfile.update({
      where: { userId: id },
      data: updateData,
      select: { userId: true, resumeSearchEnabled: true, approvalStatus: true },
    });

    // If employer was APPROVED and has never had a subscription, activate the default 0 Rs free plan
    if (body.approvalStatus === "APPROVED") {
      const existingSubs = await prisma.subscription.count({
        where: { employerId: id },
      });

      if (existingSubs === 0) {
        // Find or create the free plan (0 Rs)
        let freePlan = await prisma.plan.findFirst({
          where: { amount: 0, status: "ACTIVE" },
        });

        if (!freePlan) {
          freePlan = await prisma.plan.create({
            data: {
              name: "Free Plan",
              description: "Basic introductory plan with limited postings.",
              amount: 0,
              currency: "INR",
              durationDays: 30,
              jobLimit: 5,
              resumeSearchEnabled: false,
              xraySearchEnabled: false,
              status: "ACTIVE",
            },
          });
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + freePlan.durationDays);

        const subscription = await prisma.subscription.create({
          data: {
            employerId: id,
            planId: freePlan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: endDate,
          },
        });

        await prisma.employerProfile.update({
          where: { userId: id },
          data: {
            subscriptionId: subscription.id,
            subscriptionStatus: "ACTIVE",
            subscriptionExpiry: endDate,
            resumeSearchEnabled: freePlan.resumeSearchEnabled,
            xraySearchEnabled: freePlan.xraySearchEnabled,
          },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH /api/admin/users/[id]]", e);
    return NextResponse.json(
      { error: "Failed to update employer profile." },
      { status: 500 }
    );
  }
}
