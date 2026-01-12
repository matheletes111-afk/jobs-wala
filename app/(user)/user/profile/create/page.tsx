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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create Your Profile</h1>
      <ProfileForm />
    </div>
  );
}

