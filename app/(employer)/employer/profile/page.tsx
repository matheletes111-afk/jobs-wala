import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EmployerProfileForm from "@/components/employer/EmployerProfileForm";

export default async function EmployerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireEmployer();
  const params = await searchParams;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/employer/profile/create");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8 mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Account
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Company Profile
          </h1>
          <p className="text-gray-600">
            Manage your company information and settings.
          </p>
        </div>
        <EmployerProfileForm
        profile={profile}
        userEmail={user.email ?? undefined}
        emailChangeStatus={params.email_changed as string | undefined}
        emailChangeError={params.error as string | undefined}
      />
      </div>
    </div>
  );
}

