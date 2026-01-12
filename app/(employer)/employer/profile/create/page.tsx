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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create Company Profile</h1>
      <EmployerProfileForm />
    </div>
  );
}

