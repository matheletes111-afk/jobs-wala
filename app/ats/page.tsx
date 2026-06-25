import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import Header from "@/components/Header";
import { 
  ChevronDown, 
  Sparkles, 
  Cpu, 
  HelpCircle, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Globe,
  Mail,
  Clock,
  CheckCircle2
} from "lucide-react";

export const metadata = {
  title: "Enterprise ATS (Applicant Tracking System) - JobDaddy",
  description: "Automate candidate sourcing, AI screening, ranking, and pipeline management with JobDaddy's AI-Powered Applicant Tracking System.",
};

export default async function AtsPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative bg-transparent overflow-x-hidden">
        {/* Decorative background blobs */}
        <div className="absolute right-[5%] top-[8%] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-10000" />
        <div className="absolute left-[-10%] top-[35%] w-[500px] h-[500px] bg-orange-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200">
                <Sparkles className="size-3.5" />
                AI-Powered Recruitment System
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Enterprise <br />
                <span className="text-blue-600">Applicant Tracking.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                Automate candidate sourcing, screening, ranking, and pipeline management. Transition from legacy software in under 24 hours and identify top-tier matches with absolute semantic precision.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <Link href="#pricing">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider">
                    Start Today
                  </Button>
                </Link>
                <Link href="#faq">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider text-slate-700 bg-white">
                    How it Works <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Media Display */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-video lg:aspect-auto lg:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-blue-500/10 bg-white/50 backdrop-blur-md p-2 hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="/images/ats_preview.png"
                  alt="JobDaddy ATS Dashboard Preview"
                  className="w-full h-full object-cover rounded-xl shadow-inner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Core Frameworks Section */}
        <section className="bg-slate-50/70 border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Three Core Technical Frameworks
              </h2>
              <p className="mt-4 text-base font-medium text-slate-500">
                JobDaddy ATS operates on next-gen infrastructure engineered to accelerate placement velocity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Framework 1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-blue-550/10 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                  <Cpu className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">AI Contextual Semantic Matching</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Parses candidate career trajectories, soft skill parameters, and role alignment instead of relying on basic keyword searches.
                </p>
              </div>

              {/* Framework 2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-orange-550/10 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                  <Globe className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Programmatic XML Multi-Posting</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Broadcasts openings to hundreds of top-tier global job boards, aggregation systems, and local listings concurrently.
                </p>
              </div>

              {/* Framework 3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-green-550/10 flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Unified Outreach Automation</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Maintains prospective talent engagement through structured communication workflows, automated updates, and email notifications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing/Plans Section (Light background with differentiated card colors) */}
        <section id="pricing" className="bg-slate-50/70 border-y border-slate-100 py-20 text-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Exclusive Resume Blueprints</span>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl mt-2 text-slate-900">
                Pricing & Subscription Plans
              </h2>
              <p className="mt-4 text-base font-medium text-slate-500">
                Choose the perfect career accelerator package designed to maximize your professional impact.
              </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch mb-16 max-w-6xl mx-auto">
              {/* Fresher Blueprint */}
              <div className="bg-blue-50/75 rounded-3xl p-8 border border-blue-150 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] text-slate-850 mx-2 my-4 lg:my-0">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎓</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Fresher Blueprint</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Entry-Level</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold text-blue-600">₹999</span>
                    <span className="text-slate-500 font-medium text-xs ml-2">/ one-time</span>
                  </div>
                  <p className="text-xs text-slate-550 mt-4 leading-relaxed font-semibold">
                    For students & 0–2 yr professionals stepping into their first role.
                  </p>
                  <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-650">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> Complete ATS-friendly rewrite
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> Single-page recruiter format
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> Keyword optimization (entry roles)
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> Cover letter template
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> 48-hour delivery
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-blue-600 shrink-0" /> 1 round of revision
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register">
                    <Button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl h-11 font-bold text-xs uppercase tracking-wider transition-all">
                      Choose Fresher
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mid-Level Accelerator */}
              <div className="bg-[#485c96] rounded-3xl p-8 border-2 border-[#eab308] shadow-2xl relative flex flex-col justify-between transition-all scale-[1.03] z-10 text-white mx-2 my-4 lg:my-0">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#eab308] text-slate-900 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Mid-Level Accelerator</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#eab308]">Professional</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold text-[#eab308]">₹2,449</span>
                    <span className="text-blue-200 font-medium text-xs ml-2">/ one-time</span>
                  </div>
                  <p className="text-xs text-blue-100 mt-4 leading-relaxed font-semibold">
                    For 3–8 yr professionals targeting senior IC and lead roles.
                  </p>
                  <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-100">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> Strategic positioning rewrite
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> Role-specific keyword engineering
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> Quantified impact statements
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> LinkedIn headline + About rewrite
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> Personalised cover letter
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-[#eab308] shrink-0" /> Unlimited revisions (7 days)
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register">
                    <Button className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-slate-900 rounded-xl h-11 font-bold text-xs uppercase tracking-wider transition-all">
                      Choose Mid-Level
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Executive Empire */}
              <div className="bg-purple-50/75 rounded-3xl p-8 border border-purple-150 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] text-slate-850 mx-2 my-4 lg:my-0">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👑</span>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Executive Empire</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-650">Leadership</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-baseline">
                    <span className="text-4xl font-extrabold text-purple-650">₹4,999</span>
                    <span className="text-slate-500 font-medium text-xs ml-2">/ one-time</span>
                  </div>
                  <p className="text-xs text-slate-550 mt-4 leading-relaxed font-semibold">
                    For Directors, VPs & C-suite shaping the next chapter of their career.
                  </p>
                  <ul className="mt-8 space-y-4 text-xs font-semibold text-slate-655">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> Executive narrative & branding
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> Board / leadership formatting
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> Full LinkedIn profile overhaul
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> Bio + recruiter pitch document
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> 1-on-1 strategy call (30 min)
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="size-4 text-purple-650 shrink-0" /> Priority delivery (24h)
                    </li>
                  </ul>
                </div>
                <div className="mt-8">
                  <Link href="/register">
                    <Button className="w-full bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl h-11 font-bold text-xs uppercase tracking-wider transition-all">
                      Choose Executive
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs / Q&A Section */}
        <section id="faq" className="bg-slate-50/70 border-t border-slate-100 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 mb-4">
                <HelpCircle className="size-3.5" />
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Everything You Need to Know
              </h2>
            </div>

            {/* Q&A Items */}
            <div className="space-y-6">
              {/* Q1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center shrink-0">
                    Q
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      What is the JobDaddy ATS platform and how does it work?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      The JobDaddy ATS (Applicant Tracking System) is a cloud-based, AI-powered recruitment management platform that automates candidate sourcing, screening, ranking, and pipeline management. The platform operates through three core technical frameworks: <strong>AI Contextual Semantic Matching</strong> (which parses career trajectory and skills context rather than keywords), <strong>Programmatic XML Multi-Posting</strong> (which broadcasts job openings across hundreds of global job boards simultaneously), and <strong>Unified Outreach Automation</strong> (which maintains candidate engagement through automated communication workflows). Enterprises transition from legacy ATS systems to JobDaddy in under 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              {/* Q2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center shrink-0">
                    Q
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      What are the JobDaddy ATS subscription plans and pricing?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      JobDaddy ATS offers three subscription tiers: the <strong>Recruiter Growth Plan</strong> for independent recruiters and boutique agencies (includes full ATS access, resume parsing, and 5 active pipelines), the <strong>Agency Enterprise Pro</strong> for high-volume recruitment agencies (includes unlimited pipelines, programmatic XML multi-posting, and AI semantic matching), and the <strong>Custom Corporate Scale</strong> for large global enterprises (includes custom API access, cloud telephony integration, automated IVR, and a dedicated account success manager). All plans include a 14-day free trial with no credit card required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Q3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm">
                <div className="flex gap-4">
                  <div className="size-8 rounded-full bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center shrink-0">
                    Q
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      How does the JobDaddy ATS 14-day free trial work?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      The JobDaddy ATS 14-day free trial provides complete access to core platform features with zero financial commitment and no credit card required. During the trial, your team can post live job openings, import existing candidate pipelines, test the AI semantic matching engine, and measure placement velocity against your current system. Setup takes under 2 hours. At the end of the trial, you choose a subscription plan or continue with no obligation. Enterprise teams can request a personalised guided demo instead.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-primary py-16 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0,transparent_100%)]" />
          <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Ready to Modernize Your Hiring Process?</h2>
            <p className="text-blue-100 max-w-xl mx-auto font-medium">
              Start today. Setup is fully ready in under 2 hours.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link href="/register">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-transform">
                  Start Today
                </Button>
              </Link>
              <Link href="/#contact">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl bg-transparent">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
