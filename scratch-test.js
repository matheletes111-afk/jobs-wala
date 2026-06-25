const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  const categories = await prisma.category.findMany({ take: 1 });
  console.log("Database response:", categories);
}

main()
  .catch((e) => {
    console.error("Connection failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
