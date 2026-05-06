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
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-black text-foreground">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-12">
        <div className="linear-card rounded-[2.5rem] bg-white/[0.02] p-8 sm:p-12 mb-12 border border-white/5 animate-in fade-in-up duration-500 fill-mode-both hover:scale-100 hover:border-white/5">
          <div className="mb-8">
            <Link
              href="/employer/jobs"
              className="inline-flex items-center gap-3 h-10 px-5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/10 transition-all active:scale-95 group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Job List
            </Link>
          </div>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            Employer Portal
          </p>
          <h1 className="mb-2 text-3xl font-black text-foreground lg:text-5xl tracking-tighter">
            Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">Job</span>
          </h1>
          <p className="text-muted-foreground font-semibold max-w-2xl">
            Update the details of your job opening. Changes will be reflected once you save.
          </p>
        </div>
        <div className="rounded-[3rem] p-1 shadow-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          <JobForm jobId={job.id} initialData={initialData as any} />
        </div>
      </div>
    </div>
  );
}
