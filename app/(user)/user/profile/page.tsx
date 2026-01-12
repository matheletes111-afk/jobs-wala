import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/user/ProfileForm";

export default async function ProfilePage() {
  const user = await requireJobSeeker();

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/user/profile/create");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Profile</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}

