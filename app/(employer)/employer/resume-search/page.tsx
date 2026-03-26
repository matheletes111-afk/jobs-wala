import { requireEmployer } from "@/lib/auth-utils";
import EmployerResumeDatabaseSearch from "@/components/employer/EmployerResumeDatabaseSearch";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EmployerResumeSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireEmployer();
  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { resumeSearchEnabled: true },
  });

  if (!employerProfile?.resumeSearchEnabled) {
    redirect("/employer/dashboard");
  }

  const params = await searchParams;
  return <EmployerResumeDatabaseSearch searchParams={params} />;
}

