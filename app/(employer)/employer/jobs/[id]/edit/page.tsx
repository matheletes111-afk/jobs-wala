import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import JobForm from "@/components/employer/JobForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployer();
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job || job.postedBy !== user.id) {
    notFound();
  }

  // Convert string[] skills to comma-separated string for the form
  const initialData = {
    ...job,
    requiredSkills: job.requiredSkills.join(", "),
    secondarySkills: job.secondarySkills.join(", "),
    payType: job.payType ?? undefined,
    currency: job.currency ?? undefined,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    experienceMin: job.experienceMin ?? undefined,
    experienceMax: job.experienceMax ?? undefined,
    companyName: job.companyName ?? undefined,
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-10 mb-8 shadow-sm animate-in fade-in duration-500">
          <div className="mb-6">
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-slate-200 transition-all active:scale-95 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Job List
            </Link>
          </div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600">
            Employer Portal
          </p>
          <h1 className="mb-2 text-2xl font-bold text-slate-900 lg:text-3xl tracking-tight">
            Edit Job
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-2xl">
            Update the details of your job opening. Changes will be reflected once you save.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <JobForm jobId={job.id} initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
