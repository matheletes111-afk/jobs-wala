import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const [approved, pending, rejected, total] = await Promise.all([
  p.employerProfile.count({ where: { approvalStatus: "APPROVED" } }),
  p.employerProfile.count({ where: { approvalStatus: "PENDING" } }),
  p.employerProfile.count({ where: { approvalStatus: "REJECTED" } }),
  p.employerProfile.count(),
]);

console.log("─────────────────────────────");
console.log("Total employers :", total);
console.log("✅ APPROVED      :", approved);
console.log("⏳ PENDING       :", pending);
console.log("❌ REJECTED      :", rejected);
console.log("─────────────────────────────");

await p.$disconnect();
