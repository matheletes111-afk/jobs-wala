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
  refundAmount?: number | null;
  refundStatus?: string | null;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export default function EmployerSubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [activePlanEndDate, setActivePlanEndDate] = useState<string | null>(null);
  const [activePlanDetails, setActivePlanDetails] = useState<{ name: string, amount: number, currency: string } | null>(null);
  const [scheduledPlanId, setScheduledPlanId] = useState<string | null>(null);
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
      setActivePlanEndDate(data.activePlanEndDate);
      setActivePlanDetails(data.activePlanDetails);
      setScheduledPlanId(data.scheduledPlanId || null);
      setScheduledPlanDetails(data.scheduledPlanDetails || null);
      setHadFreePlan(data.hadFreePlan || false);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (activePlanId && activePlanDetails && plan.amount > 0 && plan.id !== activePlanId) {
      const confirmMessage = `You are currently on the ${activePlanDetails.name} Plan (${activePlanDetails.amount} ${activePlanDetails.currency}).\n\nIf you switch to the ${plan.name} Plan, it will start immediately.\n\nYour existing plan will be cancelled immediately, and any unused days will be automatically calculated and refunded to your original payment method. Would you like to proceed?`;

      if (!window.confirm(confirmMessage)) {
        return;
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
            alert("Subscription activated successfully!");
            window.location.reload();
          } else {
            alert("Verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#2563eb",
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
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:px-8 lg:px-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Header */}
      <div className="mb-10 text-center animate-in fade-in duration-700">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">Premium Membership</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Choose the Perfect Plan
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-slate-500">
          Scale your hiring with our flexible subscription plans. Unlock advanced features and reach more candidates.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-10 flex justify-center animate-in fade-in duration-700">
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab("plans")}
            className={`rounded-full px-6 py-2 text-xs font-semibold transition-all ${activeTab === "plans" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {activeTab === "plans" ? <span style={{ color: "white" }}>Subscription Plans</span> : "Subscription Plans"}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`rounded-full px-6 py-2 text-xs font-semibold transition-all ${activeTab === "history" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {activeTab === "history" ? <span style={{ color: "white" }}>Payment History</span> : "Payment History"}
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <div className="space-y-8">
          {scheduledPlanDetails && activePlanDetails && activePlanEndDate && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center shadow-sm">
              <div className="mb-1.5 flex items-center justify-center gap-2 text-blue-600">
                <Rocket className="h-4.5 w-4.5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Upgrade Pending</h3>
              </div>
              <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                Success! Your <strong>{scheduledPlanDetails.name}</strong> has been scheduled.<br />
                It will activate automatically on <strong>{new Date(activePlanEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>, and you will be charged <strong>{scheduledPlanDetails.amount} {scheduledPlanDetails.currency}</strong> at that time.
              </p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 group relative flex flex-col rounded-2xl p-8 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {scheduledPlanId === plan.id ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
                    <Rocket className="h-3 w-3" style={{ color: "white" }} />
                    <span style={{ color: "white" }}>Upgrade Scheduled</span>
                  </div>
                ) : activePlanId === plan.id ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5">
                    <Check className="h-3 w-3" style={{ color: "white" }} />
                    <span style={{ color: "white" }}>Active Plan</span>
                  </div>
                ) : plan.amount > 0 ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-100 border border-blue-200 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Recommended
                  </div>
                ) : null}

                <div className="mb-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 group-hover:scale-105 transition-transform duration-300">
                    {plan.amount === 0 ? <Shield className="h-5 w-5" /> : <Rocket className="h-5 w-5" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">{plan.durationDays} Days Validity</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-slate-800">{plan.amount}</span>
                  <span className="text-xs font-bold uppercase text-slate-400">{plan.currency}</span>
                  <span className="text-xs font-semibold text-slate-400">/ Period</span>
                </div>

                <div className="mb-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {plan.jobLimit === -1 ? "Unlimited" : plan.jobLimit} Job Postings
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${plan.resumeSearchEnabled ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {plan.resumeSearchEnabled ? <Check className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    </div>
                    <span className={`text-xs font-bold ${plan.resumeSearchEnabled ? 'text-slate-600' : 'text-slate-400 line-through'}`}>
                      Resume Database Search
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${plan.xraySearchEnabled ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                      {plan.xraySearchEnabled ? <Check className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                    </div>
                    <span className={`text-xs font-bold ${plan.xraySearchEnabled ? 'text-slate-600' : 'text-slate-400 line-through'}`}>
                      X-Ray Search Access
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                      <Check className="h-3 w-3" />
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
                  className={`mt-auto w-full rounded-xl px-4 py-3 text-xs font-bold uppercase transition-all duration-300 ${
                    activePlanId === plan.id
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                      : scheduledPlanId === plan.id
                        ? "bg-blue-50 text-blue-550 cursor-not-allowed border border-blue-200"
                        : !!scheduledPlanId
                          ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                          : plan.amount === 0 && (hadFreePlan || (activePlanDetails ? activePlanDetails.amount > 0 : false))
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  }`}
                >
                  <span style={
                    (activePlanId === plan.id ||
                    processingId === plan.id ||
                    (plan.amount === 0 && (hadFreePlan || (activePlanDetails ? activePlanDetails.amount > 0 : false))))
                      ? {}
                      : { color: "white" }
                  }>
                    {processingId === plan.id ? (
                      "Processing..."
                    ) : activePlanId === plan.id ? (
                      "Currently Active"
                    ) : plan.amount === 0 && activePlanDetails && activePlanDetails.amount > 0 ? (
                      "Unavailable (Premium Active)"
                    ) : plan.amount === 0 && hadFreePlan ? (
                      "Already Used"
                    ) : (
                      plan.amount === 0 ? "Activate Free Plan" : "Subscribe Now"
                    )}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 animate-in fade-in duration-700">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-slate-800">Payment History</h2>
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 font-bold uppercase text-slate-500 bg-slate-50">
                  <th className="p-4">Plan</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Refund Details</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4 text-right">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments
                  .filter((p) => p.plan.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((payment) => (
                    <tr key={payment.id} className="text-slate-700 transition-colors hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-800">{payment.plan.name}</td>
                      <td className="p-4 font-semibold">{payment.plan.amount === 0 ? "Free" : `${payment.plan.amount} ${payment.plan.currency}`}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${payment.status === "ACTIVE" ? "bg-emerald-50 border-emerald-150 text-emerald-600" :
                          payment.status === "SCHEDULED" ? "bg-blue-50 border-blue-150 text-blue-600" :
                            payment.status === "CANCELLED" ? "bg-red-50 border-red-150 text-red-600" :
                              "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                        {payment.refundAmount ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-amber-700">₹{payment.refundAmount.toFixed(2)}</span>
                            <span className="text-[9px] font-bold uppercase text-slate-400">{payment.refundStatus}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
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
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic font-semibold">
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
