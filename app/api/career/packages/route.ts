import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

const DEFAULT_PACKAGES = [
  {
    name: "Fresher Blueprint",
    description: "For students & 0-2 yr professionals stepping into their first role.",
    price: 999.00,
    tier: "fresher",
    features: [
      "Complete ATS-friendly rewrite",
      "Single-page recruiter format",
      "Keyword optimization (entry roles)",
      "Cover letter template",
      "48-hour delivery",
      "1 round of revision"
    ],
  },
  {
    name: "Mid-Level Accelerator",
    description: "For 3-8 yr professionals targeting senior IC and lead roles.",
    price: 2449.00,
    tier: "mid_level",
    features: [
      "Strategic positioning rewrite",
      "Role-specific keyword engineering",
      "Quantified impact statements",
      "LinkedIn headline + About rewrite",
      "Personalised cover letter",
      "Unlimited revisions (7 days)"
    ],
  },
  {
    name: "Executive Empire",
    description: "For Directors, VPs & C-suite shaping the next chapter of their career.",
    price: 4999.00,
    tier: "executive",
    features: [
      "Executive narrative & branding",
      "Board / leadership formatting",
      "Full LinkedIn profile overhaul",
      "Bio + recruiter pitch document",
      "1-on-1 strategy call (30 min)",
      "Priority delivery (24h)"
    ],
  }
];

export async function GET(req: NextRequest) {
  try {
    let packages = await prisma.careerPackage.findMany({
      orderBy: { price: "asc" },
    });

    if (packages.length !== 3) {
      // Re-align and seed exactly the 3 default packages
      await prisma.careerPackage.deleteMany({});
      await prisma.careerPackage.createMany({
        data: DEFAULT_PACKAGES,
      });
      packages = await prisma.careerPackage.findMany({
        orderBy: { price: "asc" },
      });
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Packages GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, features, tier } = body;

    if (!name || price === undefined || !tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPackage = await prisma.careerPackage.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        features: Array.isArray(features) ? features : [],
        tier,
      },
    });

    return NextResponse.json(newPackage);
  } catch (error) {
    console.error("Packages POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description, price, features, tier } = body;

    if (!id || !name || price === undefined || !tier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedPackage = await prisma.careerPackage.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        features: Array.isArray(features) ? features : [],
        tier,
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Packages PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing package ID" }, { status: 400 });
    }

    await prisma.careerPackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Packages DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
