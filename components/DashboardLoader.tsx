import { Loader2 } from "lucide-react";

export default function DashboardLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 bg-gray-50/80 px-4">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-[#2563eb]/15" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200/80">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" strokeWidth={2.5} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">Taking you to your dashboard</p>
        <p className="mt-1 text-xs text-gray-500">Please wait a moment...</p>
      </div>
    </div>
  );
}
