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
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-primary">
            Settings & Identity
          </p>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Profile</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
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

