import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import Header from "@/components/Header";
import { prisma } from "@/lib/prisma";
import {
  ChevronRight,
  Check,
  Star,
  Globe,
  Mail,
  Cpu,
  UserCheck,
  Award,
  TrendingUp
} from "lucide-react";

export const metadata = {
  title: "Enterprise ATS (Applicant Tracking System) - JobDaddy",
  description: "Automate candidate sourcing, AI screening, ranking, and pipeline management with JobDaddy's AI-Powered Applicant Tracking System.",
};

export default async function AtsPage() {
  const user = await getCurrentUser();

  // Fetch employer plans from DB if available
  const employerPlans = await prisma.plan.findMany({
    where: {
      amount: { gt: 0 },
      status: "ACTIVE",
    },
    orderBy: {
      amount: "asc",
    },
  }).catch(() => []);

  // Fetch career packages from DB if available
  const careerPackages = await prisma.careerPackage.findMany({
    where: {
      tier: { in: ["fresher", "mid_level", "executive"] }
    },
    orderBy: {
      price: "asc",
    },
  }).catch(() => []);

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-white font-sans text-slate-900 selection:bg-blue-500/20">
      <Header />

      {/* Main Content Container */}
      <main className="flex-1 relative bg-white overflow-x-hidden">

        {/* HERO SECTION */}
        <section
          style={{ backgroundColor: '#090d16', color: '#ffffff' }}
          className="relative min-h-[85vh] flex items-center border-b border-slate-800 overflow-hidden"
        >

          {/* Full-width Banner Image Background */}
          <div
            className="absolute inset-0 bg-cover bg-left opacity-90 pointer-events-none"
            style={{ backgroundImage: `url('/images/ats/ats-banner.png')`, backgroundPosition: 'left center' }}
          />

          {/* Light Left Gradient for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/95 via-[#090d16]/70 to-transparent pointer-events-none" />

          {/* Right Background Typography overlay - Scaled to fit 100% inside viewport without clipping */}
          <div 
            style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            className="absolute right-6 lg:right-16 top-1/2 -translate-y-1/2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-wider uppercase select-none hidden md:block pointer-events-none leading-none max-w-xs sm:max-w-sm md:max-w-md text-right z-0"
          >
            ENTERPRISE <br />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255, 255, 255, 0.55)', display: 'block', marginTop: '8px' }}>
              STREAMLINED TALENT ACQUISITION
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-10 z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column Content */}
              <div className="lg:col-span-7 space-y-6 max-w-xl">
                
                {/* Orange Dot Tagline */}
                <div 
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(51, 65, 85, 0.8)' }}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border backdrop-blur-md"
                >
                  <span style={{ backgroundColor: '#ff5722' }} className="w-2.5 h-2.5 rounded-full animate-pulse" />
                  <span style={{ color: '#ff5722', fontWeight: 800, letterSpacing: '0.22em', fontSize: '10px', textTransform: 'uppercase' }}>
                    AI-POWERED RECRUITMENT SYSTEMS
                  </span>
                </div>

                {/* Main Hero Header */}
                <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.06]">
                  <span style={{ color: '#ffffff' }}>Enterprise</span> <br />
                  <span style={{ color: '#ff5722', textShadow: '0 2px 8px rgba(255,87,34,0.3)' }}>
                    Applicant Tracking.
                  </span>
                </h1>

                {/* Paragraph Content inside floating dark container matching exact mockup card */}
                <div 
                  style={{ backgroundColor: 'rgba(20, 30, 48, 0.95)', borderColor: 'rgba(51, 65, 85, 0.7)', borderRadius: '16px', padding: '20px 24px' }}
                  className="border shadow-2xl max-w-xl backdrop-blur-md"
                >
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    Automate candidate sourcing, screening, ranking, and pipeline management. Transition from legacy software in under 24 hours and identify top-tier matches with absolute semantic precision.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="#pricing">
                    <Button 
                      style={{ backgroundColor: '#ff5722', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0 32px', height: '48px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      className="shadow-xl shadow-orange-500/30 transition-transform hover:scale-105 active:scale-95"
                    >
                      START TODAY
                    </Button>
                  </Link>
                  <Link href="#frameworks">
                    <Button 
                      style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '12px', padding: '0 26px', height: '48px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                      HOW IT WORKS <ChevronRight style={{ color: '#ff5722' }} className="size-4" />
                    </Button>
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>


        {/* ==========================================
            2. THREE CORE TECHNICAL FRAMEWORKS (Using imported images in public/images/ats/)
            ========================================== */}
        <section id="frameworks" className="bg-white py-24 border-b border-slate-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">

            {/* Centered Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
              <span style={{ color: '#2563eb', fontWeight: 800, letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>
                ARCHITECTURE
              </span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
                Three Core Technical Frameworks
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-normal leading-relaxed">
                JobDaddy ATS operates on next-gen infrastructure engineered to accelerate placement velocity, engineered for scalable placement, accuracy, and precision.
              </p>
            </div>

            {/* Framework Items List */}
            <div className="space-y-24 max-w-6xl mx-auto">

              {/* ---------------- ITEM 1: AI CONTEXTUAL SEMANTIC MATCHING ---------------- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Text Description */}
                <div className="lg:col-span-6 space-y-6">
                  <span style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.2em', fontSize: '11px', textTransform: 'uppercase' }}>
                    01 // AI INTEGRATION
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    AI Contextual Semantic Matching
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Parses multi-format resumes, skill set parameters, and job alignments pattern-based matching on basic keyword searches. Our engine understands the nuance of career progression.
                  </p>

                  <ul className="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Check style={{ color: '#2563eb' }} className="size-3.5 stroke-[3]" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Neural Network Analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Check style={{ color: '#2563eb' }} className="size-3.5 stroke-[3]" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Contextual Mapping</span>
                    </li>
                  </ul>
                </div>

                {/* Imported Image 1: public/images/ats/ats-img-1.png */}
                <div className="lg:col-span-6 flex justify-center">
                  <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} className="w-full max-w-md">
                    <img
                      src="/images/ats/ats-img-1.png"
                      alt="AI Contextual Semantic Matching"
                      style={{ objectFit: 'cover' }}
                      className="w-full h-auto block transition-all hover:scale-105"
                    />
                  </div>
                </div>

              </div>


              {/* ---------------- ITEM 2: PROGRAMMATIC XML MULTI-POSTING ---------------- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Imported Image 2: public/images/ats/ats-img-2.png */}
                <div className="lg:col-span-6 lg:order-1 flex justify-center">
                  <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} className="w-full max-w-md">
                    <img
                      src="/images/ats/ats-img-2.png"
                      alt="Programmatic XML Multi-Posting"
                      style={{ objectFit: 'cover' }}
                      className="w-full h-auto block transition-all hover:scale-105"
                    />
                  </div>
                </div>

                {/* Text Description (Right) */}
                <div className="lg:col-span-6 lg:order-2 space-y-6">
                  <span style={{ color: '#f97316', fontWeight: 700, letterSpacing: '0.2em', fontSize: '11px', textTransform: 'uppercase' }}>
                    02 // GLOBAL MULTI-CHANNEL DISTRIBUTION
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Programmatic XML Multi-Posting
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Broadcasts openings to hundreds of top-tier global job boards, aggregation systems, and local listings concurrently with automated optimization.
                  </p>

                  <ul className="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Star style={{ fill: '#f97316', stroke: 'none' }} className="size-3.5" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Continuous Sync Control</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Star style={{ fill: '#f97316', stroke: 'none' }} className="size-3.5" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Real-Time Syncing</span>
                    </li>
                  </ul>
                </div>

              </div>


              {/* ---------------- ITEM 3: UNIFIED OUTREACH AUTOMATION ---------------- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Text Description */}
                <div className="lg:col-span-6 space-y-6">
                  <span style={{ color: '#2563eb', fontWeight: 700, letterSpacing: '0.2em', fontSize: '11px', textTransform: 'uppercase' }}>
                    03 // INTERACTIVE ENGAGEMENT
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    Unified Outreach Automation
                  </h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    Automate personalized candidate engagement through structured communication workflows, automated updates, and intelligent notifications.
                  </p>

                  <ul className="space-y-3 pt-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Check style={{ color: '#2563eb' }} className="size-3.5 stroke-[3]" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Automated Engagement</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }} className="size-6 rounded-full border flex items-center justify-center shrink-0">
                        <Check style={{ color: '#2563eb' }} className="size-3.5 stroke-[3]" />
                      </div>
                      <span style={{ color: '#334155', fontWeight: 600 }}>Multi-Channel Outreach</span>
                    </li>
                  </ul>
                </div>

                {/* Imported Image 3: public/images/ats/ats-img-3.png */}
                <div className="lg:col-span-6 flex justify-center">
                  <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} className="w-full max-w-md">
                    <img
                      src="/images/ats/ats-img-3.png"
                      alt="Unified Outreach Automation"
                      style={{ objectFit: 'cover' }}
                      className="w-full h-auto block transition-all hover:scale-105"
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* ==========================================
            3. ENTERPRISE ATS PRICING & SUBSCRIPTIONS
            ========================================== */}
        <section id="pricing" style={{ backgroundColor: '#f5f8fc', borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }} className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">

            {/* Centered Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
              <span style={{ color: '#0052ff', fontWeight: 800, letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>
                MANAGE YOUR PRODUCTS
              </span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
                Enterprise ATS Pricing & Subscriptions
              </h2>
              <p className="text-slate-500 text-sm sm:text-base font-normal leading-relaxed">
                Choose the perfect recruiter package designed to scale your placement speed and sourcing platform.
              </p>
            </div>

            {/* Pricing Cards Grid (Dynamic DB query with fallback) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {employerPlans && employerPlans.length > 0 ? (
                employerPlans.map((plan, idx) => {
                  const isFeatured = idx === 1 || plan.name.toLowerCase().includes("lite") || plan.name.toLowerCase().includes("popular");
                  return (
                    <div 
                      key={plan.id}
                      style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '24px', 
                        border: isFeatured ? '2px solid #0052ff' : '1px solid #e2e8f0', 
                        padding: '32px' 
                      }}
                      className={`${isFeatured ? 'shadow-2xl' : 'shadow-lg'} flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900 relative`}
                    >
                      {isFeatured && (
                        <div 
                          style={{ backgroundColor: '#0052ff', color: '#ffffff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', padding: '6px 20px', borderRadius: '9999px', position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)' }}
                          className="shadow-md text-center uppercase"
                        >
                          MOST POPULAR
                        </div>
                      )}

                      <div>
                        <span style={{ color: isFeatured ? '#0052ff' : '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                          {plan.durationDays >= 365 ? 'ANNUAL' : plan.durationDays >= 180 ? 'LITE MODE' : 'STARTER'}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900">
                          {plan.name}
                        </h3>

                        {/* Price */}
                        <div className="mt-6 flex items-baseline">
                          <span style={{ color: isFeatured ? '#0052ff' : '#0f172a', fontWeight: 900 }} className="text-5xl tracking-tight">₹{plan.amount}</span>
                          <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ {plan.durationDays} Days</span>
                        </div>

                        {/* Features */}
                        <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-700">
                          <li className="flex items-center gap-3">
                            <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                            <span style={{ color: '#334155' }}>{plan.jobLimit} Active Job Pipelines</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                            <span style={{ color: '#334155' }}>Resume Search: {plan.resumeSearchEnabled ? 'Enabled' : 'Disabled'}</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                            <span style={{ color: '#334155' }}>AI X-Ray Search: {plan.xraySearchEnabled ? 'Enabled' : 'Disabled'}</span>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-10">
                        <Link href="/register">
                          <Button 
                            style={{ 
                              backgroundColor: isFeatured ? '#0052ff' : '#0a121e', 
                              color: '#ffffff', 
                              borderRadius: '12px', 
                              height: '48px', 
                              fontWeight: 700, 
                              fontSize: '12px', 
                              letterSpacing: '0.05em', 
                              textTransform: 'uppercase', 
                              width: '100%', 
                              border: 'none' 
                            }}
                            className={isFeatured ? 'shadow-lg shadow-blue-500/20' : ''}
                          >
                            GET STARTED
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {/* CARD 1: Starter Plan Jobs */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}
                    className="shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900 relative"
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        STARTER
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">
                        Starter Plan Jobs
                      </h3>

                      {/* Price */}
                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-5xl tracking-tight">₹100</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ 30 Days</span>
                      </div>

                      {/* Features */}
                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>10 Active Job Pipelines</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Resume Search: Enabled</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>AI X-Ray Search: Enabled</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          GET STARTED
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* CARD 2: JobDaddy Lite (FEATURED - MOST POPULAR) */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '2px solid #0052ff', padding: '32px' }}
                    className="shadow-2xl flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900 relative"
                  >
                    
                    {/* Top Featured Pill Badge */}
                    <div 
                      style={{ backgroundColor: '#0052ff', color: '#ffffff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.15em', padding: '6px 20px', borderRadius: '9999px', position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)' }}
                      className="shadow-md text-center uppercase"
                    >
                      MOST POPULAR
                    </div>

                    <div>
                      <span style={{ color: '#0052ff', fontWeight: 700, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        LITE MODE
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">
                        JobDaddy Lite
                      </h3>

                      {/* Price */}
                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0052ff', fontWeight: 900 }} className="text-5xl tracking-tight">₹500</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ 180 Days</span>
                      </div>

                      {/* Features */}
                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-700">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#334155' }}>50 Active Job Pipelines</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#334155' }}>Resume Search: Enabled</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#334155' }}>AI X-Ray Search: Enabled</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0052ff', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                          className="shadow-lg shadow-blue-500/20"
                        >
                          GET STARTED
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* CARD 3: Yearly Jobs Plan */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', padding: '32px' }}
                    className="shadow-lg flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900 relative"
                  >
                    <div>
                      <span style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        ANNUAL
                      </span>
                      <h3 className="text-2xl font-black text-slate-900">
                        Yearly Jobs Plan
                      </h3>

                      {/* Price */}
                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-5xl tracking-tight">₹1000</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ 365 Days</span>
                      </div>

                      {/* Features */}
                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>100 Active Job Pipelines</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Resume Search: Enabled</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>AI X-Ray Search: Enabled</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          GET STARTED
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </section>


        {/* ==========================================
            4. CANDIDATE CAREER PACKAGES
            ========================================== */}
        <section style={{ backgroundColor: '#e8f0fe', borderBottom: '1px solid rgba(203, 213, 225, 0.8)' }} className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">

            {/* Centered Header */}
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-3">
              <span style={{ color: '#0052ff', fontWeight: 800, letterSpacing: '0.25em', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>
                UNMATCHED RESUME ACCELERATION
              </span>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl">
                Candidate Career Packages
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
                Empower each career path with professional candidate services designed by top industry experts—the prerequisite to bridge the gap between candidate talent and top global placement.
              </p>
            </div>

            {/* 3 Career Package Cards Grid (Dynamic DB query with fallback) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
              {careerPackages && careerPackages.length > 0 ? (
                careerPackages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', padding: '32px' }}
                    className="shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }} className="size-10 rounded-2xl border flex items-center justify-center text-blue-600 shrink-0">
                          {pkg.tier === 'fresher' ? <UserCheck className="size-5" /> : pkg.tier === 'mid_level' ? <TrendingUp className="size-5" /> : <Award className="size-5" />}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                          <span style={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase' }}>
                            {pkg.tier.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-4xl tracking-tight">₹{pkg.price}</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ one-time</span>
                      </div>

                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        {pkg.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-3">
                            <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                            <span style={{ color: '#475569' }}>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          PURCHASE PACKAGE
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* PACKAGE 1: Fresher Blueprint */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', padding: '32px' }}
                    className="shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }} className="size-10 rounded-2xl border flex items-center justify-center text-blue-600 shrink-0">
                          <UserCheck className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Fresher Blueprint</h3>
                          <span style={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase' }}>ENTRY LEVEL</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-4xl tracking-tight">₹999</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ one-time</span>
                      </div>

                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Complete ATS-friendly resume</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Single page cover letter format</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          PURCHASE PACKAGE
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* PACKAGE 2: Mid-Level Accelerator */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', padding: '32px' }}
                    className="shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }} className="size-10 rounded-2xl border flex items-center justify-center text-blue-600 shrink-0">
                          <TrendingUp className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Mid-Level Accelerator</h3>
                          <span style={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase' }}>MID LEVEL</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-4xl tracking-tight">₹2449</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ one-time</span>
                      </div>

                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Strategic positioning review</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>LinkedIn Profile + Format Rewrite</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          PURCHASE PACKAGE
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* PACKAGE 3: Executive Catalyst */}
                  <div 
                    style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #cbd5e1', padding: '32px' }}
                    className="shadow-md flex flex-col justify-between transition-transform hover:-translate-y-1 text-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }} className="size-10 rounded-2xl border flex items-center justify-center text-blue-600 shrink-0">
                          <Award className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Executive Catalyst</h3>
                          <span style={{ color: '#94a3b8', fontWeight: 800, letterSpacing: '0.1em', fontSize: '10px', textTransform: 'uppercase' }}>EXECUTIVE</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-baseline">
                        <span style={{ color: '#0f172a', fontWeight: 900 }} className="text-4xl tracking-tight">₹4900</span>
                        <span style={{ color: '#64748b', fontWeight: 600 }} className="text-xs ml-2">/ one-time</span>
                      </div>

                      <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-600">
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Executive narrative formatting</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <Check style={{ color: '#0052ff' }} className="size-4 shrink-0 stroke-[3]" />
                          <span style={{ color: '#475569' }}>Full Strategy & LinkedIn Overhaul</span>
                        </li>
                      </ul>
                    </div>

                    <div className="mt-10">
                      <Link href="/register">
                        <Button 
                          style={{ backgroundColor: '#0a121e', color: '#ffffff', borderRadius: '12px', height: '48px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase', width: '100%', border: 'none' }}
                        >
                          PURCHASE PACKAGE
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>
        </section>


        {/* ==========================================
            5. RECRUITMENT Q&A DETAILS (Floating Dark Rectangular Section Box)
            ========================================== */}
        <section id="faq" className="bg-white py-10 sm:py-16">
          <div className="w-full max-w-full px-2 sm:px-4 lg:px-6">
            <div 
              style={{ backgroundColor: '#090e17', borderRadius: '32px' }}
              className="p-8 sm:p-12 lg:p-16 shadow-2xl border border-slate-800 text-white relative overflow-hidden"
            >
              
              {/* Header with Circle Q Badge */}
              <div className="text-center mb-16 space-y-4">
                <div className="flex justify-center">
                  <div 
                    style={{ backgroundColor: 'rgba(0, 82, 255, 0.2)', borderColor: 'rgba(0, 82, 255, 0.6)', color: '#60a5fa' }}
                    className="size-10 rounded-full border flex items-center justify-center font-black text-sm shadow-md"
                  >
                    ?
                  </div>
                </div>
                <h2 style={{ color: '#ffffff', fontWeight: 900 }} className="text-4xl tracking-tight sm:text-5xl">
                  Recruitment Q&A details
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }} className="max-w-xl mx-auto">
                  Clear answers on how JobDaddy's platform powers your recruitment & staffing success.
                </p>
              </div>

              {/* Q&A Accordion Items with Left Accent Bar */}
              <div className="space-y-6">
                
                {/* Question 1 */}
                <div 
                  style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '32px', position: 'relative', overflow: 'hidden' }}
                  className="shadow-xl"
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#0052ff' }} />
                  <div className="space-y-3">
                    <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }} className="flex items-start gap-3">
                      <span style={{ color: '#0052ff', fontWeight: 800 }}>Q.</span>
                      What is the JobDaddy ATS Platform and how does it work?
                    </h3>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', fontWeight: 400 }} className="pl-7">
                      The JobDaddy ATS (Applicant Tracking System) is a cloud-based, AI-powered recruitment management platform that automates candidate sourcing, screening, ranking, and pipeline management. The platform operates through three core technical frameworks: AI Contextual Semantic Matching, Programmatic XML Multi-Posting, and Unified Outreach Automation.
                    </p>
                  </div>
                </div>

                {/* Question 2 */}
                <div 
                  style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '32px', position: 'relative', overflow: 'hidden' }}
                  className="shadow-xl"
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#0052ff' }} />
                  <div className="space-y-3">
                    <h3 style={{ color: '#ffffff', fontWeight: 700, fontSize: '18px' }} className="flex items-start gap-3">
                      <span style={{ color: '#0052ff', fontWeight: 800 }}>Q.</span>
                      How accurate are JobDaddy's subscription plans and pricing?
                    </h3>
                    <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', fontWeight: 400 }} className="pl-7">
                      JobDaddy ATS offers subscription packages for independent recruiters, recruitment agencies, and large global enterprises starting as low as ₹100. Each package includes access to pipeline management tools, candidate tracking engines, and resume database optimization.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>


        {/* ==========================================
            6. ELECTRIC BLUE BOTTOM CTA BANNER
            ========================================== */}
        <section style={{ backgroundColor: '#0052ff', color: '#ffffff' }} className="py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0,transparent_75%)]" />
          <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
              Need Top-Tier Global Talent?
            </h2>
            <p className="text-blue-100 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-medium">
              We source and match modern technology, industry talent to fit client's unique hiring needs. Start your search today.
            </p>

            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button
                  style={{ backgroundColor: '#f97316', color: '#ffffff', border: 'none', borderRadius: '12px', height: '52px', padding: '0 32px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  className="shadow-xl shadow-orange-600/30 transition-transform hover:scale-105 active:scale-95"
                >
                  BUY SLOTS
                </Button>
              </Link>
              <Link href="/#contact">
                <Button
                  style={{ backgroundColor: 'transparent', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: '12px', height: '52px', padding: '0 32px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  className="transition-transform hover:scale-105 active:scale-95"
                >
                  BROWSE CANDIDATES
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
