"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { UserRole } from "@/types";

export default function DashboardRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }
    const role = session.user.role as UserRole;
    switch (role) {
      case UserRole.ADMIN:
        router.replace("/admin/dashboard");
        break;
      case UserRole.EMPLOYER:
        router.replace("/employer/dashboard");
        break;
      case UserRole.JOB_SEEKER:
        router.replace("/user/dashboard");
        break;
      default:
        router.replace("/login");
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-50/90 px-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#2563eb]/15" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200/80">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
          Welcome to JobsDaddy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}
