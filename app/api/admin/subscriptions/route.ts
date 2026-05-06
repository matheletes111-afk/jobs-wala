import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { employer: { companyName: { contains: query, mode: "insensitive" } } },
          { plan: { name: { contains: query, mode: "insensitive" } } },
          { employer: { user: { email: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: {
        employer: {
          select: { companyName: true, user: { select: { email: true } } },
        },
        plan: {
          select: { name: true, amount: true, currency: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}
