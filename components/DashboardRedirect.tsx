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
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 linear-card px-4 relative">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-600/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white border border-blue-100 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Welcome to JobDaddy
        </h1>
        <p className="mt-2 text-sm text-gray-500">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}
