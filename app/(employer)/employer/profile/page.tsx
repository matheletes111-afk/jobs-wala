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
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-20">
        <div className="linear-card rounded-[2.5rem] p-10 sm:p-12 mb-12 shadow-md animate-in slide-in-from-top-10 duration-1000">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Company Settings
          </p>
          <h1 className="mb-2 text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
            Company <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Profile</span>
          </h1>
          <p className="text-muted-foreground font-medium italic">
            Manage your organizational details and contact information.
          </p>
        </div>
        <div className="linear-card rounded-[3rem] p-1 shadow-md overflow-hidden">
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

