import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import Header from "@/components/Header";
import {
  ChevronDown,
  Sparkles,
  HelpCircle,
  Zap,
  ShieldCheck,
  ArrowRight,
  Globe,
  CheckCircle2,
  Users,
  Briefcase,
  MapPin,
  Code,
  DollarSign
} from "lucide-react";

export const metadata = {
  title: "Executive Search & Global Recruitment - JobDaddy",
  description: "Success-based executive search, global recruitment, and enterprise IT staffing across the USA, UK, Europe, India, and the Gulf.",
};

export default async function ExecutiveSearchPage() {
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
                Global Leadership & Executive Recruitment
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Executive Search <br />
                <span className="text-blue-600">& Global Hiring.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
                Close critical mandates within a 48-hour matching window. Reach elite leadership, C-suite, technical, and high-volume talent pools through a network established over 15+ years across the USA, UK, Europe, India, and the Gulf.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <Link href="/#contact">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider">
                    Initiate Search Mandate
                  </Button>
                </Link>
                <Link href="#it-services">
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider text-slate-700 bg-white">
                    Explore IT Staffing <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Media Display */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg aspect-video lg:aspect-auto lg:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-blue-500/10 bg-white/50 backdrop-blur-md p-2 hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="/images/executive_search.jpeg"
                  alt="JobDaddy Global Recruitment"
                  className="w-full h-full object-cover rounded-xl shadow-inner"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Practice Areas / Service Models */}
        <section className="bg-slate-50/70 border-y border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Three Specialized Practice Areas
              </h2>
              <p className="mt-4 text-base font-medium text-slate-500">
                Targeted matching mechanisms designed for specific operational tiers and talent requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Practice Area 1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-blue-550/10 flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Executive Search & Leadership</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  C-suite executives, VP levels, directors, and strategic leadership roles. Focused on organizational alignment and vision mapping.
                </p>
              </div>

              {/* Practice Area 2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-orange-550/10 flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform">
                  <Code className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">IT Services & Tech Staffing</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Dedicated engineering pods, technical specialists, and offshore developers to support modern roadmaps and sprints.
                </p>
              </div>

              {/* Practice Area 3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                <div className="size-12 rounded-xl bg-green-550/10 flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
                  <Users className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">High-Volume Talent Pipelines</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Accelerated pipelines for large-scale enterprise expansions, bulk mandates, and operational rapid-growth sprints.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise IT Services */}
        <section id="it-services" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Managed Tech Resources</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl mt-2">
              Enterprise IT Services
            </h2>
            <p className="mt-4 text-base font-medium text-slate-500">
              Deploy vetted technical talent through adaptable engagement frameworks that prioritize development velocity and hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* IT Model 1 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Dedicated Tech Resource Staffing</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Immediate deployment of pre-vetted senior software developers, system architects, and tech leads directly into internal teams. Ideal for short-term project sprints and accelerating software release cycles.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Technology Scope</span>
                <p className="text-xs text-slate-500 font-semibold">React Native, .NET, Java, Full Stack, DevOps, SRE</p>
              </div>
            </div>

            {/* IT Model 2 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Tiered Commission Partnership</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  Performance-linked staffing partnerships geared towards agencies, Managed Service Providers (MSPs), and systems integration partners looking to expand capability footprints dynamically without overhead bloat.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Engagement Model</span>
                <p className="text-xs text-slate-500 font-semibold">Tiered Commission, Sub-Contracting, Agency Partnerships</p>
              </div>
            </div>

            {/* IT Model 3 */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Hybrid Offshore Engineering Pods</h3>
                <p className="text-sm text-slate-650 font-medium leading-relaxed font-sans">
                  Highly cost-effective, dedicated developer centers situated in India's leading innovation hubs. Access specialized talents with round-the-clock delivery overlaps and infrastructure support.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2">
                <div className="flex gap-2 items-center">
                  <MapPin className="size-3.5 text-orange-500" />
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Primary Hubs</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold">Greater Noida, Bangalore, Hyderabad, Pune</p>
              </div>
            </div>
          </div>
        </section>

        {/* Commercial Framework / Pricing Model */}
        <section id="commercial-model" className="bg-slate-50/70 border-t border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-wider">
                  <DollarSign className="size-3" /> Risk-Free Partnerships
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                  Success-Based Recruitment Model
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed text-sm">
                  We believe that you should only pay for proven results. Our commercial model aligns our performance with your candidate onboarding results. There are absolutely no upfront retainers or engagement fees.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Zero Upfront Cost</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Pay only when a candidate accepts your offer and completes their onboarding.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="size-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Transparent Success Rates</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Standard fees range from 7% to 15% of the candidate's first-year base salary.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Standard Rate Structure</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-500">Volume Staffing Contracts</span>
                    <span className="text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded-lg">7% - 9%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium border-t border-slate-50 pt-3">
                    <span className="text-slate-500">Mid-Level & Technical Roles</span>
                    <span className="text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded-lg">10% - 12%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-medium border-t border-slate-50 pt-3">
                    <span className="text-slate-500">C-Suite & Executive Search</span>
                    <span className="text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded-lg">13% - 15%</span>
                  </div>
                </div>
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-xs font-semibold text-orange-800 leading-relaxed">
                  💡 Placements are backed by our 90-day replacement guarantee framework for absolute hire assurance.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs / Q&A Section */}
        <section id="faq" className="border-t border-slate-150 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200 mb-4">
                <HelpCircle className="size-3.5" />
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
                Recruitment Q&A details
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
                      How does JobDaddy deliver executive search and global recruitment services?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      JobDaddy delivers executive search and global recruitment through a network built over 15+ years across the USA, UK, Europe, India, and the Gulf. Recruitment mandates are closed within a 48-hour candidate matching window across three specialised practice areas: Executive Search and Leadership Hiring (C-suite, directors, and strategic leadership roles), IT Services and Technical Staffing (engineering pods, offshore development teams, and specialist technical resources), and High-Volume Talent Pipelines (large-scale mandates for rapid enterprise expansion). All placements are success-based clients pay only when a hire is confirmed.
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
                      What is the JobDaddy success-based recruitment model?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      JobDaddy's success-based recruitment model means enterprise clients pay zero upfront costs for recruitment services. The fee structure is a percentage of the placed candidate's first-year compensation, charged only upon successful hire confirmation. This eliminates financial risk for the client and ensures JobDaddy's commercial incentives are perfectly aligned with the quality of each placement. Current success fee rates range from 7% to 15% depending on role seniority, urgency, and engagement volume.
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
                      What IT staffing and managed technology services does JobDaddy provide?
                    </h3>
                    <p className="mt-3 text-slate-650 font-medium text-sm leading-relaxed">
                      JobDaddy delivers three enterprise IT engagement models: Dedicated Tech Resource Staffing (immediate deployment of vetted developers and architects for internal engineering sprints and product roadmaps), Tiered Commission Partnership Models (performance-linked staffing partnerships for agencies and MSP partners), and Hybrid Offshore Engineering Pods (cost-effective dedicated development centres in India's top talent hubs including Greater Noida, Bangalore, Hyderabad, and Pune). Technology specialisations include React Native, .NET, Java, Full Stack development, DevOps, and SRE roles.
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
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Need Top-Tier Global Talent?</h2>
            <p className="text-blue-100 max-w-xl mx-auto font-medium">
              Hire leaders and build offshore technology resource pods on a 100% success-backed model.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link href="/#contact">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-transform">
                  Initiate Search
                </Button>
              </Link>
              <Link href="/#contact">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl bg-transparent">
                  Schedule Consultation
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
