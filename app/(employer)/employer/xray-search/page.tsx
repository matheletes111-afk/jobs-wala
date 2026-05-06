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
    <div className="min-h-screen w-full bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {isRestricted && (
          <div className="mb-12 linear-card rounded-[2rem] border-blue-500/20 bg-blue-500/5 p-8 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <AlertCircle className="h-6 w-6 text-blue-400 shrink-0" />
            <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">
              X-Ray search is not included in your current plan. Please upgrade to access this feature.
            </p>
          </div>
        )}

        {!isRestricted ? (
          <XRaySearch />
        ) : (
          <div className="linear-card rounded-[3rem] p-24 text-center border-dashed border-white/10 bg-white/[0.01] opacity-50">
            <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
              X-Ray Search Locked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
