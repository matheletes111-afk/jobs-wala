import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/user/ProfileForm";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireJobSeeker();
  const params = await searchParams;

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/user/profile/create");
  }

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200/60 pb-6 animate-in fade-in duration-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
            Settings & Identity
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Professional Profile
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-2xl">
            Maintain your professional identity and account credentials.
          </p>
        </div>
        <ProfileForm
          profile={profile}
          userEmail={user.email ?? undefined}
          emailChangeStatus={params.email_changed as string | undefined}
          emailChangeError={params.error as string | undefined}
        />
      </div>
    </div>
  );
}

