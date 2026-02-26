import { requireJobSeeker } from "@/lib/auth-utils";
import JobSearch from "@/components/user/JobSearch";

export default async function JobsPage() {
  await requireJobSeeker();

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="mb-8 rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Discover
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Browse Jobs
          </h1>
          <p className="text-gray-600">
            Find opportunities that match your skills and career goals.
          </p>
        </div>
        <JobSearch />
      </div>
    </div>
  );
}
