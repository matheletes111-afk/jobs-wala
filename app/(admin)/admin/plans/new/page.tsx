"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "0",
    durationDays: "30",
    jobLimit: "10",
    resumeSearchEnabled: false,
    xraySearchEnabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/plans");
        router.refresh();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to create plan");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 md:px-8 lg:px-10">
      <Link href="/admin/plans" className="group mb-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Plans
      </Link>

      <div className="mb-12">
        <div className="mb-2 flex items-center gap-3">
           <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Subscription System</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">New Plan</span>
        </h1>
        <p className="mt-4 text-base font-medium text-white/50 leading-relaxed">
          Configure a new plan with custom job limits, search access, and billing duration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Basic Info */}
          <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan Identity</span>
             </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-white/70">Plan Name</label>
              <input
                required
                type="text"
                placeholder="e.g., Enterprise Monthly"
                className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-semibold text-white/70">Description (Optional)</label>
              <textarea
                placeholder="What benefits does this plan offer?"
                className="min-h-[120px] w-full rounded-2xl border border-white/5 bg-white/5 p-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Right Column: Pricing & Limits */}
          <div className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quotas & Pricing</span>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-white/70">Price (INR)</label>
                  <input
                    required
                    type="number"
                    className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10"
                    value={formData.amount}
                    onChange={(e) => {
                      const newAmount = e.target.value;
                      const numAmount = Number(newAmount);
                      let newDuration = formData.durationDays;
                      if (numAmount > 0 && !["30", "90", "180", "365"].includes(newDuration)) {
                        newDuration = "30";
                      }
                      setFormData({ ...formData, amount: newAmount, durationDays: newDuration });
                    }}
                  />
                  <p className="text-xs text-white/40 italic">* Set to 0 for Free Plan</p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-semibold text-white/70">Duration (Billing Cycle)</label>
                  {Number(formData.amount) > 0 ? (
                    <select
                      className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10 appearance-none"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    >
                      <option value="30" className="bg-zinc-900 text-white">Monthly (30 Days)</option>
                      <option value="90" className="bg-zinc-900 text-white">Quarterly (90 Days)</option>
                      <option value="180" className="bg-zinc-900 text-white">Half-Yearly (180 Days)</option>
                      <option value="365" className="bg-zinc-900 text-white">Yearly (365 Days)</option>
                    </select>
                  ) : (
                    <input
                      required
                      type="number"
                      placeholder="e.g. 14"
                      className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10"
                      value={formData.durationDays}
                      onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    />
                  )}
                </div>
             </div>

             <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70">Job Posting Limit</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="unlimitedJobs"
                    className="h-4 w-4 rounded border-white/10 bg-white/5"
                    checked={formData.jobLimit === "-1"}
                    onChange={(e) => setFormData({ ...formData, jobLimit: e.target.checked ? "-1" : "10" })}
                  />
                  <label htmlFor="unlimitedJobs" className="text-[10px] font-bold uppercase tracking-widest text-white/40 cursor-pointer">Unlimited</label>
                </div>
              </div>
              <input
                required
                type="number"
                disabled={formData.jobLimit === "-1"}
                className={`h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10 ${formData.jobLimit === "-1" ? "opacity-50 cursor-not-allowed" : ""}`}
                value={formData.jobLimit === "-1" ? "" : formData.jobLimit}
                placeholder={formData.jobLimit === "-1" ? "Unlimited" : "Enter number"}
                onChange={(e) => setFormData({ ...formData, jobLimit: e.target.value })}
              />
            </div>

            <div 
               onClick={() => setFormData({ ...formData, resumeSearchEnabled: !formData.resumeSearchEnabled })}
               className={`flex items-center justify-between rounded-2xl border p-5 transition-all duration-300 cursor-pointer select-none ${
                 formData.resumeSearchEnabled 
                   ? 'border-blue-500/30 bg-blue-50/10' 
                   : 'border-slate-200 bg-white hover:bg-slate-50'
               }`}
            >
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                     formData.resumeSearchEnabled ? 'bg-yellow-500/10 text-yellow-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                     <Zap className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                     <span className="text-sm font-bold text-slate-800">Resume Search Access</span>
                     <p className="text-xs text-slate-500">Allow employers to search and view candidate resume profiles.</p>
                  </div>
               </div>
               <div
                  style={{ backgroundColor: formData.resumeSearchEnabled ? '#2563eb' : '#94a3b8' }}
                  className="h-6 w-11 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 border border-slate-400/20"
               >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 transform ${formData.resumeSearchEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>

            <div 
               onClick={() => setFormData({ ...formData, xraySearchEnabled: !formData.xraySearchEnabled })}
               className={`flex items-center justify-between rounded-2xl border p-5 transition-all duration-300 cursor-pointer select-none ${
                 formData.xraySearchEnabled 
                   ? 'border-indigo-500/30 bg-indigo-50/10' 
                   : 'border-slate-200 bg-white hover:bg-slate-50'
               }`}
            >
               <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                     formData.xraySearchEnabled ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                     <Zap className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                     <span className="text-sm font-bold text-slate-800">X-Ray Search Access</span>
                     <p className="text-xs text-slate-500">Enable Google X-Ray search to find candidates directly on LinkedIn.</p>
                  </div>
               </div>
               <div
                  style={{ backgroundColor: formData.xraySearchEnabled ? '#4f46e5' : '#94a3b8' }}
                  className="h-6 w-11 rounded-full transition-all duration-300 relative flex items-center px-1 shrink-0 border border-slate-400/20"
               >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-md transition-all duration-300 transform ${formData.xraySearchEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-6 border-t border-white/5 pt-10">
           <Link href="/admin/plans">
              <Button variant="ghost" type="button" className="h-14 rounded-2xl px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white">
                Cancel
              </Button>
           </Link>
           <Button
            type="submit"
            disabled={loading}
            className="h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 px-12 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating..." : (
              <span className="flex items-center gap-3">
                <Save className="h-4 w-4" />
                Save & Deploy Plan
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
