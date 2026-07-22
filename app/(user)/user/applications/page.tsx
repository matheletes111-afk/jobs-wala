import { requireJobSeeker } from "@/lib/auth-utils";
import ApplicationSearch from "@/components/user/ApplicationSearch";

export default async function ApplicationsPage() {
  await requireJobSeeker();

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200/60 pb-6 animate-in fade-in duration-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">
            Track Applications
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My Applications
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 max-w-2xl">
            Real-time tracking of your professional outreach and application status.
          </p>
        </div>
        <ApplicationSearch />
      </div>
    </div>
  );
}
