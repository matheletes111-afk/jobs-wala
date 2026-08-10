"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  xraySearchEnabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
}

interface Subscriber {
  id: string;
  employer: {
    companyName: string;
    pointOfContact?: string | null;
    phone?: string | null;
    user: {
      name?: string | null;
      email: string;
    };
  };
  plan: {
    name: string;
    amount: number;
    currency: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  razorpaySubscriptionId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  refundId?: string | null;
  refundStatus?: string | null;
  refundError?: string | null;
  createdAt: string;
}

export default function AdminPlansPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "subscribers">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const searchQueryRef = useRef(searchQuery);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);

  const fetchPlans = useCallback(async () => {
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
  }, []);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQueryRef.current) params.set("search", searchQueryRef.current);
      if (startDateRef.current) params.set("startDate", startDateRef.current);
      if (endDateRef.current) params.set("endDate", endDateRef.current);
      const response = await fetch(`/api/admin/subscribers?${params.toString()}`);
      const data = await response.json();
      setSubscribers(data);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "plans") {
      fetchPlans();
    } else {
      fetchSubscribers();
    }
  }, [activeTab, fetchSubscribers, fetchPlans, startDate, endDate, searchQuery]);



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

  const handleRetryRefund = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}/retry-refund`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retry refund");
      alert("Refund processed successfully!");
      fetchSubscribers();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to retry refund");
    }
  };

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-8 border-b border-slate-200/60 pb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
               <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Subscription System</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Subscription <span className="text-blue-600">Hub</span>
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              Manage your plans and track subscriber activity in one place.
            </p>
          </div>
          {activeTab === "plans" && (
            <Link href="/admin/plans/new">
              <Button className="h-11 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 font-bold text-xs transition-all flex items-center gap-2 shadow-sm">
                <Plus className="h-4 w-4 text-blue-600" />
                <span className="text-slate-900 font-bold">Create New Plan</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="mb-8 flex w-fit items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-6 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "plans" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Manage Plans
          </button>
          <button
            onClick={() => setActiveTab("subscribers")}
            className={`px-6 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "subscribers" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Subscriber History
          </button>
        </div>

        {/* Search Bar & Date Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <form onSubmit={(e) => { e.preventDefault(); if(activeTab === "subscribers") fetchSubscribers(); }}>
              <input
                type="text"
                placeholder={activeTab === "plans" ? "Search plans by name..." : "Search by Customer, Email, Order ID, Payment ID..."}
                className="h-11 w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-700 outline-hidden transition-all focus:bg-white focus:border-blue-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {activeTab === "subscribers" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                <input
                  type="date"
                  className="h-11 rounded-xl bg-white border border-slate-200 px-3 text-xs font-semibold text-slate-750 focus:border-blue-500/50 outline-hidden"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                <input
                  type="date"
                  className="h-11 rounded-xl bg-white border border-slate-200 px-3 text-xs font-semibold text-slate-750 focus:border-blue-500/50 outline-hidden"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => { setStartDate(""); setEndDate(""); setSearchQuery(""); }}
                className="h-11 px-4 rounded-xl border-slate-200 hover:bg-slate-50 text-xs font-semibold"
              >
                Clear Filters
              </Button>
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {activeTab === "plans" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Plan Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Price</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Limits</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">Loading...</td></tr>
                  ) : filteredPlans.map((plan) => (
                    <tr key={plan.id} className="group transition-colors hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-800">{plan.name}</span>
                          <span className="text-xs font-medium text-slate-400 italic">{plan.description || "No description"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex h-8 items-center rounded-lg bg-slate-50 border border-slate-200 px-3">
                           <span className="text-xs font-bold text-slate-800">₹{plan.amount}</span>
                           <span className="ml-1 text-[9px] font-bold text-slate-400 uppercase">{plan.currency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className="text-xs font-semibold text-slate-600">
                           {plan.jobLimit === -1 ? "Unlimited" : `${plan.jobLimit} Jobs`}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${
                          plan.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-red-50 text-red-600 border-red-100"
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           <Link href={`/admin/plans/${plan.id}/edit`}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-500/50 hover:bg-blue-50"><Edit2 className="h-3.5 w-3.5" /></Button>
                           </Link>
                           <Button 
                             onClick={() => deletePlan(plan.id)}
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-500/50"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
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
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Employer & Contact Details</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Plan Purchased</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Duration</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaction & Payment IDs</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Refund Info</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">Loading subscribers...</td></tr>
                  ) : subscribers.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">No subscribers found</td></tr>
                  ) : subscribers.map((sub) => (
                    <tr key={sub.id} className="group transition-colors hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-800">{sub.employer.companyName}</span>
                          <div className="text-[11px] font-semibold text-slate-450 space-y-0.5">
                            <p>POC: {sub.employer.pointOfContact || "N/A"}</p>
                            <p>Email: {sub.employer.user.email}</p>
                            <p>Phone: {sub.employer.phone || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{sub.plan.name}</span>
                          <span className="inline-flex h-6 items-center rounded bg-blue-50 border border-blue-150 px-2 text-[10px] font-bold text-blue-600">
                            ₹{sub.plan.amount} {sub.plan.currency}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-0.5 items-center justify-center">
                          <span className="text-[10px] font-semibold text-slate-450">Start: {new Date(sub.startDate).toLocaleDateString()}</span>
                          <span className="text-[10px] font-semibold text-slate-450">End: {new Date(sub.endDate).toLocaleDateString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Created: {new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-semibold text-slate-500 space-y-1 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-sm font-mono">
                          <p className="truncate"><span className="text-slate-400">Sub ID:</span> {sub.razorpaySubscriptionId || "N/A"}</p>
                          <p className="truncate"><span className="text-slate-400">Order ID:</span> {sub.razorpayOrderId || "N/A"}</p>
                          <p className="truncate"><span className="text-slate-400">Payment ID:</span> {sub.razorpayPaymentId || "N/A"}</p>
                          <p className="truncate"><span className="text-slate-400">Signature:</span> {sub.razorpaySignature || "N/A"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sub.refundAmount ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              Refund: ₹{sub.refundAmount.toFixed(2)}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              sub.refundStatus === "SUCCESS" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {sub.refundStatus}
                            </span>
                            {sub.refundStatus === "FAILED" && (
                              <Button
                                onClick={() => handleRetryRefund(sub.id)}
                                variant="ghost"
                                size="sm"
                                className="mt-1.5 h-6 px-2 text-[9px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-250 hover:bg-rose-100"
                              >
                                Retry Refund
                              </Button>
                            )}
                            {sub.refundError && (
                              <span className="text-[9px] font-medium text-rose-500 max-w-[125px] truncate mt-0.5" title={sub.refundError}>
                                {sub.refundError}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">No Refund</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${
                           sub.status === "ACTIVE" 
                             ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                             : "bg-red-50 text-red-600 border-red-100"
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
    </div>
  );
}
