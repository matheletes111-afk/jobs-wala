/**
 * One-time migration script:
 * Bulk-approve all existing employers that are currently PENDING.
 * Does NOT touch subscriptions / plans at all.
 *
 * Run: npx ts-node -r tsconfig-paths/register scripts/approve-all-employers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all employers that are still PENDING
  const pending = await prisma.employerProfile.findMany({
    where: { approvalStatus: "PENDING" },
    select: { userId: true, companyName: true },
  });

  if (pending.length === 0) {
    console.log("✅ No PENDING employers found. Nothing to update.");
    return;
  }

  console.log(`Found ${pending.length} PENDING employer(s):`);
  pending.forEach((e) => console.log(`  • ${e.companyName} (userId: ${e.userId})`));

  // Bulk-update all of them to APPROVED
  const result = await prisma.employerProfile.updateMany({
    where: { approvalStatus: "PENDING" },
    data: { approvalStatus: "APPROVED" },
  });

  console.log(`\n✅ Successfully approved ${result.count} employer(s).`);
}

main()
  .catch((err) => {
    console.error("❌ Script failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
