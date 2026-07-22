"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subscription {
  id: string;
  employerId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  razorpaySubscriptionId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  refundAmount?: number | null;
  refundedAt?: string | null;
  refundId?: string | null;
  refundStatus?: string | null;
  refundError?: string | null;
  createdAt: string;
  employer: {
    companyName: string;
    user: {
      email: string;
    };
  };
  plan: {
    name: string;
    amount: number;
    currency: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/subscriptions?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSubscriptions(data);
      } else {
        console.error("Invalid subscription data:", data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleRetryRefund = async (subId: string) => {
    if (processingId) return;
    setProcessingId(subId);
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}/retry-refund`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to retry refund");
      alert("Refund processed successfully!");
      fetchSubscriptions();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to retry refund");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Admin Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Employer <span className="text-blue-600">Subscriptions</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            View all active/cancelled subscriptions, track payment refunds, and retry failed operations.
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Company, Email or Plan Name..."
              className="h-11 w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-700 outline-hidden transition-all focus:bg-white focus:border-blue-500/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Employer</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Plan</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Duration</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Razorpay Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Refund Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Subscription Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                      No subscription records found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="group transition-colors hover:bg-slate-50/30">
                      {/* Employer */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-800">{sub.employer?.companyName || "N/A"}</span>
                          <span className="text-[11px] font-semibold text-slate-450">{sub.employer?.user?.email || "N/A"}</span>
                        </div>
                      </td>
                      {/* Plan */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <span className="text-xs font-bold text-slate-700">{sub.plan?.name || "N/A"}</span>
                          <span className="inline-flex h-6 items-center rounded bg-blue-50 border border-blue-150 px-2 text-[10px] font-bold text-blue-600">
                            ₹{sub.plan?.amount || 0} {sub.plan?.currency || "INR"}
                          </span>
                        </div>
                      </td>
                      {/* Duration */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col gap-0.5 items-center justify-center">
                          <span className="text-[10px] font-semibold text-slate-450">Start: {new Date(sub.startDate).toLocaleDateString()}</span>
                          <span className="text-[10px] font-semibold text-slate-450">End: {new Date(sub.endDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      {/* Razorpay Info */}
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-semibold text-slate-500 space-y-0.5 bg-slate-50 border border-slate-100 p-2 rounded-lg max-w-xs font-mono">
                          <p className="truncate"><span className="text-slate-450">Sub ID:</span> {sub.razorpaySubscriptionId || "N/A"}</p>
                          <p className="truncate"><span className="text-slate-450">Payment ID:</span> {sub.razorpayPaymentId || "N/A"}</p>
                        </div>
                      </td>
                      {/* Refund Status */}
                      <td className="px-6 py-4 text-center">
                        {sub.refundAmount ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="inline-flex items-center rounded bg-amber-50 border border-amber-250 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              ₹{sub.refundAmount.toFixed(2)}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                              sub.refundStatus === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-150"
                                : "bg-rose-50 text-rose-600 border-rose-150"
                            }`}>
                              {sub.refundStatus}
                            </span>
                            {sub.refundStatus === "FAILED" && (
                              <Button
                                onClick={() => handleRetryRefund(sub.id)}
                                disabled={processingId === sub.id}
                                variant="ghost"
                                size="sm"
                                className="mt-1 h-6 px-2 text-[9px] font-bold uppercase bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center gap-1"
                              >
                                {processingId === sub.id ? (
                                  <RotateCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Retry Refund"
                                )}
                              </Button>
                            )}
                            {sub.refundError && (
                              <span className="text-[9px] font-medium text-rose-500 max-w-[150px] truncate mt-0.5 block" title={sub.refundError}>
                                {sub.refundError}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-450 italic">No Refund</span>
                        )}
                      </td>
                      {/* Subscription Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : sub.status === "CANCELLED"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
