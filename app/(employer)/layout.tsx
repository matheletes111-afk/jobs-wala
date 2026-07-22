import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@/types";
import { prisma } from "@/lib/prisma";
import EmployerLayoutClient from "@/components/employer/EmployerLayoutClient";
import Footer from "@/components/Footer";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== UserRole.EMPLOYER && user.role !== UserRole.ADMIN)) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { employerProfile: true },
  });

  const isApproved = user.role === UserRole.ADMIN || dbUser?.employerProfile?.approvalStatus === "APPROVED";

  return (
    <EmployerLayoutClient
      isApproved={isApproved}
      dbUserApprovalStatus={dbUser?.employerProfile?.approvalStatus}
      dbUserRejectionReason={dbUser?.employerProfile?.rejectionReason}
      userEmail={dbUser?.email || ""}
      companyLogo={dbUser?.employerProfile?.companyLogo}
      companyName={dbUser?.employerProfile?.companyName || ""}
      footer={<Footer />}
    >
      {children}
    </EmployerLayoutClient>
  );
}

