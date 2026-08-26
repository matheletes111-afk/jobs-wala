import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import UserLayoutClient from "@/components/user/UserLayoutClient";
import Footer from "@/components/Footer";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.JOB_SEEKER) {
    redirect("/login");
  }

  return (
    <UserLayoutClient
      userEmail={user.email ?? undefined}
      footer={<Footer />}
    >
      {children}
    </UserLayoutClient>
  );
}

