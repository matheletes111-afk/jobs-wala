import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect based on user role
  switch (user.role) {
    case UserRole.ADMIN:
      redirect("/admin/dashboard");
    case UserRole.EMPLOYER:
      redirect("/employer/dashboard");
    case UserRole.JOB_SEEKER:
      redirect("/user/dashboard");
    default:
      redirect("/login");
  }
}

