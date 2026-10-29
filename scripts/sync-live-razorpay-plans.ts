import { PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import process from "process";

const prisma = new PrismaClient();

async function syncPlans() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error("❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in environment variables.");
    process.exit(1);
  }

  const isLiveKey = key_id.startsWith("rzp_live_");
  console.log(`\n🔑 Razorpay Key ID: ${key_id.substring(0, 12)}... (${isLiveKey ? "LIVE MODE 🚀" : "TEST MODE 🧪"})`);

  if (!isLiveKey) {
    console.warn("⚠️ Warning: Your current key is NOT a live key (it does not start with 'rzp_live_').");
  }

  const razorpay = new Razorpay({
    key_id,
    key_secret,
  });

  // Fetch all active plans from database
  const activePlans = await prisma.plan.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n📋 Found ${activePlans.length} active plans in database:`);

  for (const plan of activePlans) {
    console.log(`\n--------------------------------------------------`);
    console.log(`📦 Plan: "${plan.name}" (ID: ${plan.id})`);
    console.log(`   Amount: ₹${plan.amount}`);
    console.log(`   Duration: ${plan.durationDays} days`);
    console.log(`   Current Razorpay Plan ID: ${plan.razorpayPlanId || "None"}`);

    if (plan.amount === 0) {
      console.log(`   ℹ️ Skipping Razorpay creation (Free Plan has ₹0 amount).`);
      continue;
    }

    let period: "daily" | "weekly" | "monthly" | "yearly" = "daily";
    let interval = plan.durationDays;

    if (plan.durationDays % 365 === 0) {
      period = "yearly";
      interval = plan.durationDays / 365;
    } else if (plan.durationDays % 30 === 0) {
      period = "monthly";
      interval = plan.durationDays / 30;
    } else if (plan.durationDays % 7 === 0) {
      period = "weekly";
      interval = plan.durationDays / 7;
    }

    try {
      console.log(`   ⏳ Creating live plan on Razorpay (${period}, interval ${interval})...`);

      const rpPlan = await razorpay.plans.create({
        period,
        interval,
        item: {
          name: plan.name,
          amount: Math.round(plan.amount * 100), // convert to paise
          currency: plan.currency || "INR",
          description: plan.description || undefined,
        },
      });

      console.log(`   ✅ Created on Razorpay! New Live Plan ID: ${rpPlan.id}`);

      // Update database
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          razorpayPlanId: rpPlan.id,
        },
      });

      console.log(`   💾 Updated Database record: ${plan.id} -> ${rpPlan.id}`);
    } catch (err: any) {
      console.error(`   ❌ Failed to create plan on Razorpay:`, err?.error || err?.message || err);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Plan sync finished!`);
}

syncPlans()
  .catch((e) => {
    console.error("Fatal error during plan sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

