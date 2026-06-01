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
  xraySearchEnabled: boolean;
}

interface Payment {
  id: string;
  plan: {
    name: string;
    amount: number;
    currency: string;
  };
  status: string;
  startDate: string;
  endDate: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export default function EmployerSubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [scheduledPlanId, setScheduledPlanId] = useState<string | null>(null);
  const [activePlanEndDate, setActivePlanEndDate] = useState<string | null>(null);
  const [activePlanDetails, setActivePlanDetails] = useState<{ name: string, amount: number, currency: string } | null>(null);
  const [scheduledPlanDetails, setScheduledPlanDetails] = useState<{ name: string, amount: number, currency: string } | null>(null);
  const [hadFreePlan, setHadFreePlan] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
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
      setHadFreePlan(data.hadFreePlan || false);
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
        name: "JobDaddy",
        description: `Subscription for ${plan.name}`,
        handler: async function (response: RazorpayResponse) {
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
          color: "#ea580c", // JobDaddy Orange
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate subscription";
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="mb-16 text-center animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-blue-500/50" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Premium Membership</span>
          <div className="h-px w-8 bg-blue-500/50" />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-foreground md:text-6xl">
          Choose the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">Perfect Plan</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-muted-foreground">
          Scale your hiring with our flexible subscription plans. Unlock advanced features and reach more candidates.
        </p>
      </div>

      <div className="mb-12 flex justify-center animate-in fade-in duration-700">
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab("plans")}
            className={`rounded-full px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "plans" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-full px-8 py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "history" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25" : "text-slate-500 hover:text-slate-900"
              }`}
          >
            Payment History
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <div className="space-y-8">
          {scheduledPlanDetails && activePlanDetails && activePlanEndDate && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center shadow-md">
              <div className="mb-2 flex items-center justify-center gap-2 text-orange-600">
                <Rocket className="h-5 w-5" />
                <h3 className="text-lg font-black uppercase tracking-widest">Upgrade Pending</h3>
              </div>
              <p className="text-sm font-medium text-orange-800 leading-relaxed">
                Success! Your <strong>{scheduledPlanDetails.name}</strong> has been scheduled.<br />
                It will activate automatically on <strong>{new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>, and you will be charged <strong>{scheduledPlanDetails.amount} {scheduledPlanDetails.currency}</strong> at that time.
              </p>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className={`linear-card group relative flex flex-col rounded-[2.5rem] p-10 shadow-md transition-all duration-500 hover:shadow-xl animate-in fade-in slide-in-from-bottom-10 fill-mode-both ${plan.amount > 0 ? "border-primary/20" : ""
                  }`}
                style={{ animationDelay: `${idx * 100}ms` }}
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
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                    {plan.amount === 0 ? <Shield className="h-7 w-7" /> : <Rocket className="h-7 w-7" />}
                  </div>
                  <h3 className="text-2xl font-black text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{plan.durationDays} Days Duration</p>
                </div>

                <div className="mb-10 flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tighter text-foreground">{plan.amount}</span>
                  <span className="text-sm font-black uppercase tracking-widest text-muted-foreground">{plan.currency}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/60">/ period</span>
                </div>

                <div className="mb-10 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 tracking-tight">
                      {plan.jobLimit === -1 ? "Unlimited" : plan.jobLimit} Job Postings
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${plan.resumeSearchEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {plan.resumeSearchEnabled ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-sm font-bold tracking-tight ${plan.resumeSearchEnabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      Resume Database Search
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${plan.xraySearchEnabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      {plan.xraySearchEnabled ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-sm font-bold tracking-tight ${plan.xraySearchEnabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      X-Ray Search Access
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed text-slate-500 italic">
                      {plan.description || "Standard platform support included."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={
                    activePlanId === plan.id ||
                    processingId === plan.id ||
                    !!scheduledPlanId ||
                    (plan.amount === 0 && (hadFreePlan || (activePlanDetails ? activePlanDetails.amount > 0 : false)))
                  }
                  className={`mt-auto w-full rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg ${
                    activePlanId === plan.id
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                      : scheduledPlanId === plan.id
                        ? "bg-orange-50 text-orange-500 cursor-not-allowed border border-orange-200 shadow-none"
                        : !!scheduledPlanId
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                          : plan.amount === 0 && (hadFreePlan || (activePlanDetails ? activePlanDetails.amount > 0 : false))
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none"
                            : "bg-primary text-white hover:bg-blue-600 hover:shadow-primary/25 active:scale-[0.98]"
                  }`}
                >
                  {processingId === plan.id ? (
                    "Processing..."
                  ) : activePlanId === plan.id ? (
                    "Currently Active"
                  ) : scheduledPlanId !== null ? (
                    "Action Locked"
                  ) : plan.amount === 0 && activePlanDetails && activePlanDetails.amount > 0 ? (
                    "Premium Active"
                  ) : plan.amount === 0 && hadFreePlan ? (
                    "Already Used"
                  ) : (
                    plan.amount === 0 ? "Activate Free Plan" : "Subscribe Now"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="linear-card rounded-[2.5rem] shadow-md p-8 md:p-12 animate-in fade-in duration-700">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-black text-foreground">Payment History</h2>
            <input
              type="text"
              placeholder="SEARCH PLANS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-foreground placeholder-muted-foreground/40 outline-hidden focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 bg-slate-50">
                  <th className="p-4 rounded-tl-xl">Plan</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4 text-right rounded-tr-xl">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments
                  .filter((p) => p.plan.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((payment) => (
                    <tr key={payment.id} className="text-slate-700 transition-colors hover:bg-slate-50/50">
                      <td className="p-4 font-black text-foreground">{payment.plan.name}</td>
                      <td className="p-4 font-bold">{payment.plan.amount === 0 ? "Free" : `${payment.plan.amount} ${payment.plan.currency}`}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border ${payment.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                          payment.status === "SCHEDULED" ? "bg-orange-50 border-orange-200 text-orange-600" :
                            payment.status === "CANCELLED" ? "bg-red-50 border-red-200 text-red-600" :
                              "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(payment.startDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap text-slate-500 font-medium">
                        {new Date(payment.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground/60 italic font-bold">
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
