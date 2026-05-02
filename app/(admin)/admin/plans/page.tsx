"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  durationDays: number;
  jobLimit: number;
  resumeSearchEnabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
}

export default function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "subscribers">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeTab === "plans") {
      fetchPlans();
    } else {
      fetchSubscribers();
    }
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/plans");
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions?query=${searchQuery}`);
      const data = await response.json();
      setSubscribers(data);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await fetch(`/api/admin/plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPlans();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan? This will archive it and remove it from the storefront.")) return;
    try {
      await fetch(`/api/admin/plans/${id}`, {
        method: "DELETE",
      });
      fetchPlans();
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:px-8 lg:px-10">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Subscription System</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
            Subscription <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Hub</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-white/50 leading-relaxed">
            Manage your plans and track subscriber activity in one place.
          </p>
        </div>
        {activeTab === "plans" && (
          <Link href="/admin/plans/new">
            <Button className="group h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
              <Plus className="mr-3 h-4 w-4 transition-transform group-hover:rotate-90" />
              Create New Plan
            </Button>
          </Link>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="mb-10 flex w-fit items-center rounded-2xl bg-white/5 p-1.5 backdrop-blur-3xl border border-white/5">
        <button
          onClick={() => setActiveTab("plans")}
          className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === "plans" ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:text-white/60"
          }`}
        >
          Manage Plans
        </button>
        <button
          onClick={() => setActiveTab("subscribers")}
          className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
            activeTab === "subscribers" ? "bg-white/10 text-white shadow-xl" : "text-white/40 hover:text-white/60"
          }`}
        >
          Subscriber History
        </button>
      </div>

      {/* Search Bar */}
      <div className="group relative mb-10 w-full max-w-md">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-white/30 transition-colors group-focus-within:text-blue-500" />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if(activeTab === "subscribers") fetchSubscribers(); }}>
          <input
            type="text"
            placeholder={activeTab === "plans" ? "Search plans by name..." : "Search by Employer or Plan..."}
            className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 pl-14 pr-6 text-[11px] font-bold uppercase tracking-widest text-white outline-hidden transition-all placeholder:text-white/20 focus:border-blue-500/50 focus:bg-white/10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-3xl">
        {activeTab === "plans" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Plan Details</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Price (INR)</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Limits</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Status</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-white/20">Loading...</td></tr>
                ) : filteredPlans.map((plan) => (
                  <tr key={plan.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-8 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white">{plan.name}</span>
                        <span className="text-[10px] font-medium text-white/40 italic">{plan.description || "No description"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <div className="inline-flex h-9 items-center rounded-xl bg-white/5 border border-white/5 px-4">
                         <span className="text-xs font-black text-white">{plan.amount}</span>
                         <span className="ml-2 text-[9px] font-bold text-white/30 uppercase">{plan.currency}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                       <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">
                         {plan.jobLimit === -1 ? "Unlimited" : `${plan.jobLimit} Jobs`}
                       </span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                        plan.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <div className="flex justify-end gap-3">
                         <Link href={`/admin/plans/${plan.id}/edit`}>
                           <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:text-blue-500"><Edit2 className="h-4 w-4" /></Button>
                         </Link>
                         <Button 
                           onClick={() => deletePlan(plan.id)}
                           variant="ghost" 
                           size="icon" 
                           className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:text-red-500 hover:bg-red-500/10"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Employer</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Plan Purchased</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Amount</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Expiry Date</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-white/20">Loading subscribers...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center text-white/20">No subscribers found</td></tr>
                ) : subscribers.map((sub) => (
                  <tr key={sub.id} className="group transition-colors hover:bg-white/[0.02]">
                    <td className="px-8 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-white">{sub.employer.companyName}</span>
                        <span className="text-[10px] font-medium text-white/40 italic">{sub.employer.user.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className="text-xs font-black text-white">{sub.plan.name}</span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className="text-xs font-black text-white">{sub.plan.amount} {sub.plan.currency}</span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className="text-xs font-medium text-white/60">{new Date(sub.endDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-8 py-8 text-right">
                       <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                         sub.status === "ACTIVE" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                       }`}>
                         {sub.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
