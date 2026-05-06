"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Sparkles, ShieldCheck, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "0",
    durationDays: "30",
    jobLimit: "10",
    resumeSearchEnabled: false,
    xraySearchEnabled: false,
    status: "ACTIVE",
  });

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await fetch(`/api/admin/plans/${planId}`);
        if (response.ok) {
          const plan = await response.json();
          setFormData({
            name: plan.name,
            description: plan.description || "",
            amount: plan.amount.toString(),
            durationDays: plan.durationDays.toString(),
            jobLimit: plan.jobLimit.toString(),
            resumeSearchEnabled: plan.resumeSearchEnabled,
            xraySearchEnabled: plan.xraySearchEnabled,
            status: plan.status,
          });
        } else {
          alert("Plan not found");
          router.push("/admin/plans");
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchPlan();
  }, [planId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          jobLimit: formData.jobLimit,
          resumeSearchEnabled: formData.resumeSearchEnabled,
          xraySearchEnabled: formData.xraySearchEnabled,
          status: formData.status,
        }),
      });

      if (response.ok) {
        router.push("/admin/plans");
        router.refresh();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to update plan");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading plan...</span>
      </div>
    );
  }

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
          Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Plan</span>
        </h1>
        <p className="mt-4 text-base font-medium text-white/50 leading-relaxed">
          Update the plan&apos;s configuration. Note: Price and duration are locked as they are synced with Razorpay.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Basic Info */}
          <div className="space-y-8 rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-3xl">
             <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Plan Identity</span>
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
            
            <div className="space-y-4">
              <label className="text-xs font-semibold text-white/70">Status</label>
              <select
                className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white outline-hidden transition-all focus:border-blue-500/50 focus:bg-white/10 appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE" className="bg-zinc-900 text-white">ACTIVE</option>
                <option value="INACTIVE" className="bg-zinc-900 text-white">INACTIVE</option>
                <option value="ARCHIVED" className="bg-zinc-900 text-white">DELETE</option>
              </select>
            </div>
          </div>

          {/* Right Column: Pricing & Limits */}
          <div className="space-y-8 rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-3xl">
             <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Quotas & Pricing</span>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4 opacity-60">
                  <label className="text-xs font-semibold text-white/70">Price (INR)</label>
                  <input
                    disabled
                    type="number"
                    className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white cursor-not-allowed"
                    value={formData.amount}
                  />
                  <p className="text-[10px] text-white/40 italic">Locked</p>
                </div>

                <div className="space-y-4 opacity-60">
                  <label className="text-xs font-semibold text-white/70">Duration (Days)</label>
                  <input
                    disabled
                    type="number"
                    className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 px-6 text-sm text-white cursor-not-allowed"
                    value={formData.durationDays}
                  />
                  <p className="text-[10px] text-white/40 italic">Locked</p>
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

            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
               <div className="flex items-center gap-3">
                  <Zap className={`h-4 w-4 transition-colors ${formData.resumeSearchEnabled ? 'text-yellow-500' : 'text-white/20'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Resume Search Access</span>
               </div>
               <button
                  type="button"
                  onClick={() => setFormData({ ...formData, resumeSearchEnabled: !formData.resumeSearchEnabled })}
                  className={`h-6 w-11 rounded-full transition-all duration-500 ${formData.resumeSearchEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
               >
                  <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 transform ${formData.resumeSearchEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
               <div className="flex items-center gap-3">
                  <Zap className={`h-4 w-4 transition-colors ${formData.xraySearchEnabled ? 'text-blue-500' : 'text-white/20'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">X-Ray Search Access</span>
               </div>
               <button
                  type="button"
                  onClick={() => setFormData({ ...formData, xraySearchEnabled: !formData.xraySearchEnabled })}
                  className={`h-6 w-11 rounded-full transition-all duration-500 ${formData.xraySearchEnabled ? 'bg-indigo-600' : 'bg-white/10'}`}
               >
                  <div className={`h-4 w-4 rounded-full bg-white transition-all duration-300 transform ${formData.xraySearchEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
               </button>
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
            className="h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 px-12 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Updating..." : (
              <span className="flex items-center gap-3">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
