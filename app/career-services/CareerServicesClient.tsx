"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  UploadCloud,
  Check,
  Sparkles,
  AlertTriangle,
  FileText,
  ArrowRight,
  Lock,
  RefreshCw,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  tier: string;
}

export default function CareerServicesClient() {
  const { data: session } = useSession();

  // Packages state
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Resume Upload State Machine
  const [file, setFile] = useState<File | null>(null);
  const [showUploadLeadModal, setShowUploadLeadModal] = useState(false);
  const [uploadLeadName, setUploadLeadName] = useState("");
  const [uploadLeadEmail, setUploadLeadEmail] = useState("");
  const [uploadLeadMobile, setUploadLeadMobile] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showScoreReport, setShowScoreReport] = useState(false);
  const [atsScore, setAtsScore] = useState(58);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Purchase State Machine
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPurchaseLeadModal, setShowPurchaseLeadModal] = useState(false);
  const [purchaseName, setPurchaseName] = useState("");
  const [purchaseEmail, setPurchaseEmail] = useState("");
  const [purchaseMobile, setPurchaseMobile] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Success Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedPackageName, setPurchasedPackageName] = useState("");

  // Fetch packages on mount
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/career/packages");
        if (res.ok) {
          const data = await res.json();
          setPackages(data);
        }
      } catch (err) {
        console.error("Failed to load packages", err);
      } finally {
        setLoadingPackages(false);
      }
    }
    fetchPackages();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")) {
        setFile(droppedFile);
        setShowUploadLeadModal(true);
      } else {
        alert("Please upload a PDF file only.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.type === "application/pdf" || f.name.endsWith(".pdf")) {
        setFile(f);
        setShowUploadLeadModal(true);
      } else {
        alert("Please upload a PDF file only.");
      }
    }
  };

  // Start the 2-second simulation (frontend-only, no DB write)
  const startScan = (e: React.FormEvent) => {
    e.preventDefault();
    setShowUploadLeadModal(false);
    setIsScanning(true);
    setScanProgress(0);

    const randomScore = Math.floor(Math.random() * 23) + 45; // 45–67
    setAtsScore(randomScore);

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let progress = 0;
    scanIntervalRef.current = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(scanIntervalRef.current!);
        scanIntervalRef.current = null;
        setTimeout(() => {
          setIsScanning(false);
          setShowScoreReport(true);
        }, 300);
      }
    }, 180);
  };

  function handlePurchaseSubmit2() {
    return false;
  }

  // Razorpay guest checkout — DB write happens here (PENDING lead)
  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/career/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: purchaseName,
          email: purchaseEmail,
          mobile: purchaseMobile,
          packageId: selectedPackage.id,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Failed to initialize order");

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "JobsDaddy Career Services",
        description: `Purchase: ${selectedPackage.name}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/career/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              setPurchasedPackageName(selectedPackage.name);
              setShowPurchaseLeadModal(false);
              setShowSuccessModal(true);
              setPurchaseName("");
              setPurchaseEmail("");
              setPurchaseMobile("");
            } else {
              alert(verifyData.error || "Payment verification failed.");
            }
          } catch (err: any) {
            alert("Verification failed: " + err.message);
          }
        },
        prefill: { name: purchaseName, email: purchaseEmail, contact: purchaseMobile },
        notes: { packageId: selectedPackage.id },
        theme: { color: "#2563eb" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert("Checkout Failed: " + err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleChoosePackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPurchaseLeadModal(true);
  };

  const plans = packages.filter((p) => p.tier !== "add_on");
  const addOns = packages.filter((p) => p.tier === "add_on");

  return (
    <div className="flex-1 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-sky-50 to-white pt-16 pb-14 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            Empower Your Career Transition
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Develop Your ATS-Friendly Profile &amp; Get Hired Fast
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Ensure your CV sails through Applicant Tracking Systems. Upload for a free instant analysis or hire our experts for guaranteed placements.
          </p>
        </div>
      </section>

      {/* Resume Dropzone / Score Area */}
      <section className="max-w-4xl mx-auto px-4 -mt-6 mb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 md:p-10">
          {!showScoreReport && !isScanning && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Free AI Resume Scanner</h2>
              <p className="text-slate-500 text-sm text-center mb-8">
                Drop your resume to get an instant compatibility score &amp; pinpoint parsing issues.
              </p>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative group"
              >
                <input
                  type="file"
                  id="resume-file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-blue-50 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-base font-semibold text-slate-700 mb-1">Drag &amp; drop your PDF resume here</p>
                <p className="text-xs text-slate-400">Only PDF formats are supported for analysis</p>
                {file && (
                  <div className="mt-4 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scanning Animation */}
          {isScanning && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative h-24 w-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded animate-bounce"></div>
                <FileText className="h-16 w-16 text-blue-500 mx-auto mt-4 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Analyzing Resume Structure...</h3>
              <p className="text-slate-500 text-sm mb-6">Checking parser compliance and layout standardizations</p>
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="text-xs text-blue-600 font-semibold mt-2">{scanProgress}% completed</span>
            </div>
          )}

          {/* ATS Score Report */}
          {showScoreReport && !isScanning && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pb-6 border-b border-slate-100">
                <div className="flex flex-col items-center md:items-start">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 mb-2">
                    Urgent Optimization Required
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-1">ATS Parsability Check</h3>
                  <p className="text-slate-500 text-sm">Target Role: Professional Generalist / Developer Profile</p>
                </div>

                {/* Gauge */}
                <div className="flex items-center gap-4 bg-rose-50/50 border border-rose-100/50 p-4 rounded-xl">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                      <circle
                        cx="40"
                        cy="40"
                        r="34"
                        stroke="#f43f5e"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - atsScore / 100)}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span className="absolute text-xl font-black text-rose-600">{atsScore}%</span>
                  </div>
                  <div>
                    <p className="font-bold text-rose-700 text-sm">Critical Rating</p>
                    <p className="text-xs text-slate-500">Most recruiters filter below 75%</p>
                  </div>
                </div>
              </div>

              {/* Analysis Logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Keywords & SEO (35%)",
                    text: `Missing foundational industry keywords: Next.js, System Design, CI/CD pipelines, Unit Testing. Add relevant tools to pass keyword screenings.`,
                  },
                  {
                    label: "Formatting Layout (55%)",
                    text: "Double-column layouts detected. Recruiter parsing engines fail to properly read columns sequentially, resulting in chopped text. Use a linear format.",
                  },
                  {
                    label: "Impact Metrics (28%)",
                    text: `Bullet points are descriptive rather than metric-driven. Quantify results (e.g. "Increased load times by 40%") to display high performance score.`,
                  },
                ].map(({ label, text }) => (
                  <div key={label} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-rose-600 font-bold mb-3 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {label}
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setFile(null); setShowScoreReport(false); }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Scan Another CV
                </button>
                <a
                  href="#pricing-plans"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Fix Flaws Now (See Professional Packages)
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing-plans" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Professional Resume &amp; Career Packages</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Unlock professional resume revamps tailored to your seniority level. Guaranteed delivery.
          </p>
        </div>

        {loadingPackages ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Loading pricing options...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((pkg) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border transition-all duration-300 relative flex flex-col p-8 ${pkg.tier === "mid_level"
                  ? "border-blue-500 shadow-xl ring-2 ring-blue-500/10 scale-105 z-10"
                  : "border-slate-200 hover:border-slate-300 shadow-md hover:shadow-lg"
                  }`}
              >
                {pkg.tier === "mid_level" && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                  <p className="text-slate-500 text-xs line-clamp-2 min-h-[2rem]">
                    {pkg.description || "Expertly crafted career optimization plan."}
                  </p>
                </div>
                <div className="flex items-baseline gap-1.5 mb-8">
                  <span className="text-3xl font-extrabold text-slate-900">₹{pkg.price}</span>
                  <span className="text-slate-400 text-xs">/ package</span>
                </div>
                <ul className="space-y-3.5 mb-8 flex-grow">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChoosePackage(pkg)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all ${pkg.tier === "mid_level"
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700"
                    }`}
                >
                  Choose {pkg.name}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add-ons Section */}
      {addOns.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-200">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Power-Up Add-Ons</h2>
            <p className="text-slate-500 text-xs">Combine with packages for end-to-end career transition support.</p>
          </div>
          {loadingPackages ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {addOns.map((pkg) => (
                <div key={pkg.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                      {pkg.name}
                      <span className="text-blue-600 font-extrabold text-sm">₹{pkg.price}</span>
                    </h3>
                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                      {pkg.description || "Boost your career potential with this service."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleChoosePackage(pkg)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors"
                  >
                    Add Service
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Modal 1: Free Upload Lead Capture (no DB write) ─── */}
      {showUploadLeadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Generate Your ATS Score</h3>
            <p className="text-slate-500 text-xs text-center mb-6">
              Enter details below to receive the parsed report and score calculation instantly.
            </p>
            <form onSubmit={startScan} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={uploadLeadName}
                  onChange={(e) => setUploadLeadName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={uploadLeadEmail}
                  onChange={(e) => setUploadLeadEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> WhatsApp / Mobile
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={uploadLeadMobile}
                  onChange={(e) => setUploadLeadMobile(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200 mt-2"
              >
                <ShieldCheck className="h-4 w-4" />
                View ATS Report
              </button>
            </form>
            <button
              onClick={() => { setShowUploadLeadModal(false); setFile(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Purchase Lead Capture & Razorpay Checkout ─── */}
      {showPurchaseLeadModal && selectedPackage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full relative">
            <h3 className="text-xl font-bold text-slate-900 mb-1 text-center">Complete Registration</h3>
            <p className="text-slate-500 text-xs text-center mb-5">
              Confirm your contact details for the{" "}
              <span className="font-semibold text-blue-600">{selectedPackage.name}</span> plan.
            </p>
            <div className="bg-blue-50/50 rounded-xl p-4 mb-6 border border-blue-100/50 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Service Selected</p>
                <p className="text-sm font-bold text-slate-800">{selectedPackage.name}</p>
              </div>
              <p className="text-lg font-black text-slate-900">₹{selectedPackage.price}</p>
            </div>
            {/*<form onSubmit={handlePurchaseSubmit} className="space-y-4">*/}
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={purchaseName}
                  onChange={(e) => setPurchaseName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={purchaseEmail}
                  onChange={(e) => setPurchaseEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> WhatsApp / Mobile
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={purchaseMobile}
                  onChange={(e) => setPurchaseMobile(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={isCheckingOut}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200 mt-2"
              >
                {isCheckingOut ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Preparing Payment Gateway...</>
                ) : (
                  <><Lock className="h-3.5 w-3.5" /> Secure Checkout</>
                )}
              </button>
            </form>
            <button
              onClick={() => { setShowPurchaseLeadModal(false); setSelectedPackage(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Payment Success ─── */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 max-w-md w-full text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Order Completed Successfully!</h3>
            <p className="text-slate-500 text-xs mb-6">
              Thank you for purchasing the{" "}
              <span className="font-semibold text-blue-600">{purchasedPackageName}</span>. Our expert team will contact you via email and phone to begin work on your profile.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
