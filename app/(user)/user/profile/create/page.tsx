import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/user/ProfileForm";

export default async function CreateProfilePage() {
  const user = await requireJobSeeker();

  const existingProfile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existingProfile) {
    redirect("/user/profile");
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Setup
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Create Your Profile
          </h1>
          <p className="text-gray-600">
            Complete your profile to start applying for jobs.
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}

