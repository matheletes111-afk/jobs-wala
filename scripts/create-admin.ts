import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "process";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@jobportal.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.log(`Admin user with email ${email} already exists.`);
      if (existingAdmin.role === UserRole.ADMIN) {
        console.log("User is already an admin.");
        return;
      } else {
        // Update existing user to admin
        await prisma.user.update({
          where: { email },
          data: { role: UserRole.ADMIN },
        });
        console.log(`Updated user ${email} to admin role.`);
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🆔 User ID: ${admin.id}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

