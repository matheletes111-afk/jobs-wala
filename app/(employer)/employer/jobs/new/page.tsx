import { requireEmployer } from "@/lib/auth-utils";
import JobForm from "@/components/employer/JobForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewJobPage() {
  await requireEmployer();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8 mb-8">
          <div className="mb-4">
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to jobs
            </Link>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
            Jobs
          </p>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Post New Job
          </h1>
          <p className="text-gray-600">
            Add a new job listing. Fill in the details below to publish your opening.
          </p>
        </div>
        <JobForm />
      </div>
    </div>
  );
}

