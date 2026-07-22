import { requireEmployer } from "@/lib/auth-utils";
import XRaySearch from "@/components/employer/XRaySearch";
import { prisma } from "@/lib/prisma";
import { AlertCircle } from "lucide-react";

export default async function XRaySearchPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { 
      xraySearchEnabled: true,
      subscriptionExpiry: true,
      subscriptionStatus: true
    },
  });

  const isExpired = profile?.subscriptionExpiry ? new Date(profile.subscriptionExpiry) < new Date() : true;
  const isRestricted = !profile?.xraySearchEnabled || isExpired || profile.subscriptionStatus !== "ACTIVE";

  return (
    <div className="min-h-screen w-full bg-transparent text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {isRestricted && (
          <div className="mb-8 rounded-2xl border border-blue-250 bg-blue-50 p-6 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-700 font-bold uppercase tracking-wider">
              X-Ray search is not included in your current plan. Please upgrade to access this feature.
            </p>
          </div>
        )}

        {!isRestricted ? (
          <XRaySearch />
        ) : (
          <div className="rounded-2xl p-24 text-center border border-slate-200 bg-white shadow-sm opacity-60">
            <p className="text-lg font-bold text-slate-400 uppercase tracking-wider italic leading-relaxed">
              X-Ray Search Locked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
