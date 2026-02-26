import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EmployerProfileForm from "@/components/employer/EmployerProfileForm";

export default async function CreateEmployerProfilePage() {
  const user = await requireEmployer();

  const existingProfile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existingProfile) {
    redirect("/employer/profile");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8 mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Setup
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Create Company Profile
          </h1>
          <p className="text-gray-600">
            Complete your company profile to start posting jobs.
          </p>
        </div>
        <EmployerProfileForm />
      </div>
    </div>
  );
}

