import { Loader2 } from "lucide-react";

export default function ApplicationsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 min-h-[400px] items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-10">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-gray-500">Loading applications...</p>
      </div>
    </div>
  );
}
