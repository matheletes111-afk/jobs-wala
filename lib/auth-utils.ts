import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requireJobSeeker() {
  return requireRole([UserRole.JOB_SEEKER]);
}

export async function requireEmployer() {
  return requireRole([UserRole.EMPLOYER]);
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

