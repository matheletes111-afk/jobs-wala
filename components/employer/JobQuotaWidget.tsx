"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Zap, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

interface JobQuotaWidgetProps {
  jobLimit: number; // -1 for unlimited
  usedJobs: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  planName?: string;
  className?: string;
}

export default function JobQuotaWidget({
  jobLimit,
  usedJobs,
  startDate,
  endDate,
  planName = "Active Plan",
  className = "",
}: JobQuotaWidgetProps) {
  const isUnlimited = jobLimit === -1;
  const remainingJobs = isUnlimited ? null : Math.max(0, jobLimit - usedJobs);
  const percentage = isUnlimited
    ? 0
    : Math.min(100, Math.round((usedJobs / (jobLimit || 1)) * 100));
  const isLimitReached = !isUnlimited && usedJobs >= jobLimit;

  // Determine progress color theme
  let progressColor = "bg-emerald-500";
  let textColor = "text-emerald-600";

  if (percentage >= 90 || isLimitReached) {
    progressColor = "bg-rose-500";
    textColor = "text-rose-600";
  } else if (percentage >= 70) {
    progressColor = "bg-amber-500";
    textColor = "text-amber-600";
  }

  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;
  const formattedEndDate = endDate
    ? new Date(endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className={`bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden ${className}`}>
      {/* Decorative subtle background gradient */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-blue-50/50 blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
              {planName}
            </span>
            {formattedStartDate && formattedEndDate && (
              <span className="text-[11px] font-semibold text-slate-400">
                Cycle: {formattedStartDate} – {formattedEndDate}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Monthly Job Posting Quota
            {isLimitReached && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">
                <AlertTriangle className="h-3 w-3" /> Limit Reached
              </span>
            )}
          </h3>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          {isLimitReached ? (
            <Link href="/employer/subscription">
              <Button className="h-10 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-orange-500/10 transition-all flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "white" }} />
                <span style={{ color: "white" }}>Upgrade Plan to Post More</span>
              </Button>
            </Link>
          ) : (
            <Link href="/employer/jobs/new">
              <Button className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition-all flex items-center gap-2">
                <Plus className="h-4 w-4" style={{ color: "white" }} />
                <span style={{ color: "white" }}>Post a Job</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quota Numerical Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-5 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Allowed Jobs</p>
          <p className="text-xl font-black text-slate-800">
            {isUnlimited ? "Unlimited" : jobLimit}
          </p>
        </div>
        <div className="border-l border-slate-200/60 pl-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Jobs Posted</p>
          <p className={`text-xl font-black ${textColor}`}>
            {usedJobs}
          </p>
        </div>
        <div className="border-l border-slate-200/60 pl-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Jobs Remaining</p>
          <p className="text-xl font-black text-slate-800">
            {isUnlimited ? "∞" : remainingJobs}
          </p>
        </div>
      </div>

      {/* Visual Graphical Progress Bar */}
      {!isUnlimited && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">
              {usedJobs} of {jobLimit} jobs posted this billing cycle
            </span>
            <span className={`font-bold ${textColor}`}>
              {percentage}% Used
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {isLimitReached && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1 pt-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              You have reached your limit for this cycle. Upgrade your plan or wait for the next billing cycle.
            </p>
          )}
        </div>
      )}

      {isUnlimited && (
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your current plan allows unlimited job postings. Post as many listings as you need!</span>
        </div>
      )}
    </div>
  );
}
