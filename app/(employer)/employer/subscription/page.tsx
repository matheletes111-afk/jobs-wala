"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Shield, Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Script from "next/script";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  durationDays: number;
  jobLimit: number;
  resumeSearchEnabled: boolean;
}

export default function EmployerSubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [scheduledPlanId, setScheduledPlanId] = useState<string | null>(null);
  const [activePlanEndDate, setActivePlanEndDate] = useState<string | null>(null);
  const [activePlanDetails, setActivePlanDetails] = useState<{name: string, amount: number, currency: string} | null>(null);
  const [scheduledPlanDetails, setScheduledPlanDetails] = useState<{name: string, amount: number, currency: string} | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"plans" | "history">("plans");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchPayments()]);
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/employer/payments");
      const data = await res.json();
      setPayments(data);
    } catch (e) {
      console.error("Failed to fetch payments:", e);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/employer/plans");
      const data = await response.json();
      setPlans(data.plans);
      setActivePlanId(data.activePlanId);
      setScheduledPlanId(data.scheduledPlanId);
      setActivePlanEndDate(data.activePlanEndDate);
      setActivePlanDetails(data.activePlanDetails);
      setScheduledPlanDetails(data.scheduledPlanDetails);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (scheduledPlanId) {
      alert("You already have a pending upgrade scheduled. Please wait for it to activate before switching plans again.");
      return;
    }

    // Show dynamic transition confirmation if upgrading
    if (activePlanId && activePlanDetails && plan.amount > 0 && plan.id !== activePlanId) {
      const formattedDate = activePlanEndDate 
        ? new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'your cycle end';

      const confirmMessage = `You are currently on the ${activePlanDetails.name} Plan (${activePlanDetails.amount} ${activePlanDetails.currency}).\n\nIf you upgrade to the ${plan.name} Plan, you will not be charged for the ${activePlanDetails.name} Plan anymore.\n\nStarting on ${formattedDate}, your new ${plan.name} Plan will activate and you will be charged ${plan.amount} ${plan.currency}.`;
      
      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }
    }

    setProcessingId(plan.id);
    try {
      const response = await fetch("/api/employer/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      if (plan.amount === 0) {
        alert("Free plan activated successfully!");
        window.location.reload();
        return;
      }

      if (data.isUpgradeScheduled) {
        const formattedDate = activePlanEndDate ? new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "the end of your cycle";
        alert(`Success! Your ${plan.name} Plan has been scheduled.\n\nIt will activate automatically on ${formattedDate}, and you will be charged ${plan.amount} ${plan.currency} at that time.`);
        window.location.reload();
        return;
      }

      // Initialize Razorpay for paid plans
      const options = {
        key: data.razorpayKeyId,
        subscription_id: data.subscriptionId,
        name: "JobsDaddy",
        description: `Subscription for ${plan.name}`,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/employer/subscribe/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
            }),
          });

          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.isUpgradeScheduled) {
              const formattedDate = activePlanEndDate ? new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "the end of your cycle";
              alert(`Success! Your ${plan.name} Plan has been scheduled.\n\nIt will activate automatically on ${formattedDate}, and you will be charged ${plan.amount} ${plan.currency} at that time.`);
            } else {
              alert("Subscription activated successfully!");
            }
            window.location.reload();
          } else {
            alert("Verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#ea580c", // JobsDaddy Orange
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      alert(error.message || "Failed to initiate subscription");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="mb-16 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
           <div className="h-px w-8 bg-blue-500/50" />
           <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Premium Membership</span>
           <div className="h-px w-8 bg-blue-500/50" />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
          Choose the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Perfect Plan</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-white/50">
          Scale your hiring with our flexible subscription plans. Unlock advanced features and reach more candidates.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-full bg-white/5 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab("plans")}
            className={`rounded-full px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "plans" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-white/50 hover:text-white"
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-full px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === "history" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-white/50 hover:text-white"
            }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <div className="space-y-8">
          {scheduledPlanDetails && activePlanDetails && activePlanEndDate && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 text-center shadow-lg shadow-orange-500/5 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-center gap-2 text-orange-500">
                <Rocket className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase tracking-widest">Upgrade Pending</h3>
              </div>
              <p className="text-sm font-medium text-white/70 leading-relaxed">
                Success! Your <strong className="text-white">{scheduledPlanDetails.name}</strong> has been scheduled.<br/>
                It will activate automatically on <strong className="text-orange-400">{new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>, and you will be charged <strong className="text-white">{scheduledPlanDetails.amount} {scheduledPlanDetails.currency}</strong> at that time.
              </p>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`group relative flex flex-col rounded-[2.5rem] border p-10 transition-all duration-500 hover:scale-[1.02] ${
              plan.amount > 0 
                ? "border-blue-500/20 bg-white/[0.03] shadow-2xl shadow-blue-500/5" 
                : "border-white/5 bg-white/[0.01]"
            }`}
          >
            {scheduledPlanId === plan.id ? (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-6 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-2">
                <Rocket className="h-3 w-3" />
                Upgrade Scheduled
              </div>
            ) : activePlanId === plan.id ? (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-6 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl flex items-center gap-2">
                <Check className="h-3 w-3" />
                Your Active Plan
              </div>
            ) : plan.amount > 0 ? (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-xl">
                Recommended
              </div>
            ) : null}

            <div className="mb-8">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-blue-500 group-hover:scale-110 transition-transform duration-500">
                {plan.amount === 0 ? <Shield className="h-7 w-7" /> : <Rocket className="h-7 w-7" />}
              </div>
              <h3 className="text-2xl font-black text-white">{plan.name}</h3>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/40">{plan.durationDays} Days Duration</p>
            </div>

            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-white">{plan.amount}</span>
              <span className="text-sm font-black uppercase tracking-widest text-white/30">{plan.currency}</span>
              <span className="text-[10px] font-bold text-white/20">/ period</span>
            </div>

            <div className="mb-10 space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-white/70 tracking-tight">{plan.jobLimit} Job Postings</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${plan.resumeSearchEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-white/20'}`}>
                  {plan.resumeSearchEnabled ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-sm font-bold tracking-tight ${plan.resumeSearchEnabled ? 'text-white/70' : 'text-white/20 line-through'}`}>
                  Resume Database Search
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-white/40 italic">
                  {plan.description || "Standard platform support included."}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={activePlanId === plan.id || processingId === plan.id || !!scheduledPlanId}
              className={`mt-auto w-full rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                activePlanId === plan.id
                  ? "bg-white/5 text-white/50 cursor-not-allowed"
                  : scheduledPlanId === plan.id
                  ? "bg-orange-500/20 text-orange-500 cursor-not-allowed border border-orange-500/50"
                  : !!scheduledPlanId
                  ? "bg-white/5 text-white/20 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              }`}
            >
              {processingId === plan.id ? (
                "Processing..."
              ) : activePlanId === plan.id ? (
                "Currently Active"
              ) : scheduledPlanId !== null ? (
                "Action Locked"
              ) : (
                plan.amount === 0 ? "Activate Free Plan" : "Subscribe Now"
              )}
            </button>
          </div>
        ))}
        </div>
      </div>
      ) : (
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 md:p-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-black text-white">Payment History</h2>
            <input
              type="text"
              placeholder="SEARCH PLANS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-hidden focus:border-blue-500/50 focus:bg-white/10"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs font-bold uppercase tracking-widest text-white/40">
                  <th className="pb-4 pr-4">Plan</th>
                  <th className="pb-4 px-4">Amount</th>
                  <th className="pb-4 px-4">Status</th>
                  <th className="pb-4 px-4">Start Date</th>
                  <th className="pb-4 pl-4 text-right">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments
                  .filter((p) => p.plan.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((payment) => (
                  <tr key={payment.id} className="text-white/80 transition-colors hover:bg-white/[0.02]">
                    <td className="py-4 pr-4 font-bold">{payment.plan.name}</td>
                    <td className="py-4 px-4">{payment.plan.amount === 0 ? "Free" : `${payment.plan.amount} ${payment.plan.currency}`}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        payment.status === "ACTIVE" ? "bg-green-500/10 text-green-500" :
                        payment.status === "SCHEDULED" ? "bg-orange-500/10 text-orange-500" :
                        payment.status === "CANCELLED" ? "bg-red-500/10 text-red-500" :
                        "bg-white/10 text-white/50"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-white/60">
                      {new Date(payment.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 pl-4 text-right whitespace-nowrap text-white/60">
                      {new Date(payment.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40 italic">
                      No payment history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
