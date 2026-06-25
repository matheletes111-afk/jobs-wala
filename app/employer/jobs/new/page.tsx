import JobForm from "@/components/employer/JobForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";

export const metadata = {
  title: "Post a Job - JobDaddy",
  description: "Create a new job listing to attract top talent.",
};

export default function NewJobPage() {
  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50/50 text-slate-800">
      <Header />

      <div className="mx-auto w-full max-w-4xl min-w-0 px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95 group shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 sm:p-12 mb-8 shadow-sm">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
            Employer Portal
          </p>
          <h1 className="mb-3 text-3xl font-black text-slate-900 tracking-tight">
            Post a New <span className="text-blue-600">Job Listing</span>
          </h1>
          <p className="text-slate-500 font-semibold text-sm leading-relaxed max-w-2xl">
            Provide the details of your job opening. If you are not logged in, you can still fill out the form, and you will be prompted to log in to finalize your post.
          </p>
        </div>

        <div className="rounded-[3rem] overflow-hidden border border-slate-200 shadow-lg bg-white">
          <JobForm />
        </div>
      </div>
    </div>
  );
}
