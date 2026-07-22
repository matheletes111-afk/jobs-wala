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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200/60 pb-6 animate-in fade-in duration-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
            Company Settings
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Company Profile
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Manage your organizational details and contact information.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <EmployerProfileForm
            profile={profile}
            userEmail={user.email ?? undefined}
            emailChangeStatus={params.email_changed as string | undefined}
            emailChangeError={params.error as string | undefined}
          />
        </div>
      </div>
    </div>
  );
}

