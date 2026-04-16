import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-black">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-600/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 border border-white/10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">Taking you to your dashboard</p>
        <p className="mt-1 text-xs text-blue-400/60 animate-pulse font-bold tracking-widest uppercase">Please wait a moment...</p>
      </div>
    </div>
  );
}
