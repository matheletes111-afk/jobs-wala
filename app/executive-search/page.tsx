import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import FaqAccordion from "@/components/user/FaqAccordion";
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

export default function ExecutiveSearchPage() {

  const faqData = [
    {
      q: "How does JobDaddy define executive search and global recruitment services?",
      a: "JobDaddy delivers executive search and global recruitment through a network built over 15+ years across the USA, UK, Europe, India, and the Gulf. Recruitment mandates are closed within a 48-hour candidate matching window across three specialised practice areas: Executive Search and Leadership Hiring (C-suite, directors, and strategic leadership roles), IT Services and Technical Staffing (engineering pods, offshore development teams, and specialist technical resources), and High-Volume Talent Pipelines (large-scale mandates for rapid enterprise expansion). All placements are success-based clients pay only when a hire is confirmed."
    },
    {
      q: "What is the JobDaddy success-based recruitment model?",
      a: "JobDaddy's success-based recruitment model means enterprise clients pay zero upfront costs for recruitment services. The fee structure is a percentage of the placed candidate's first-year compensation, charged only upon successful hire confirmation. This eliminates financial risk for the client and ensures JobDaddy's commercial incentives are perfectly aligned with the quality of each placement. Current success fee rates range from 7% to 15% depending on role seniority, urgency, and engagement volume."
    },
    {
      q: "What IT staffing and managed technology services does JobDaddy provide?",
      a: "JobDaddy delivers three enterprise IT engagement models: Dedicated Tech Resource Staffing (immediate deployment of vetted developers and architects for internal engineering sprints and product roadmaps), Tiered Commission Partnership Models (performance-linked staffing partnerships for agencies and MSP partners), and Hybrid Offshore Engineering Pods (cost-effective dedicated development centres in India's top talent hubs including Greater Noida, Bangalore, Hyderabad, and Pune). Technology specialisations include React Native, .NET, Java, Full Stack development, DevOps, and SRE roles."
    }
  ];

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-white selection:bg-primary/20">
      <Header />

      {/* Main Content */}
      <main className="flex-1 relative bg-white overflow-x-hidden">

        {/* HERO SECTION */}
        <section
          className="relative min-h-[85vh] flex items-center bg-cover bg-center"
          style={{ backgroundImage: "url('/images/executive_hero.png')" }}
        >
          {/* Dark luxury overlay matching dusk/night concept */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/80 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-10 z-10 w-full">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/35 uppercase tracking-widest backdrop-blur-md">
                <Globe className="size-3.5 text-blue-400 animate-spin-slow" />
                A Global Leadership & Executive Recruitment
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-7.5xl font-extrabold tracking-tight text-white leading-tight">
                Executive Search <br />
                <span className="text-blue-500">& Global Hiring.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
                Close critical mandates within a 48-hour matching window. Reach elite leadership, C-suite, technical, and high-volume talent pools through a network established over 15+ years.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/contact">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider">
                    <span style={{ color: "white" }}>Initiate Search Mandate</span>
                  </Button>
                </Link>
                <Link href="#it-services">
                  <Button variant="outline" className="border-white/30 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider bg-transparent">
                    <span style={{ color: "white" }} className="flex items-center">
                      Explore IT Staffing <ArrowRight className="size-4 ml-1.5" style={{ color: "white" }} />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THREE SPECIALIZED PRACTICE AREAS */}
        <section className="py-24 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            {/* Centered Section Header */}
            <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-650">Our Expertise</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4.5xl leading-tight">
                Specialized Practice Areas
              </h2>
              <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full" />
            </div>

            {/* Alternating Practice Rows */}
            <div className="space-y-28">
              {/* Practice Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">01 / Executive Recruitment</span>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-slate-900 leading-tight">
                    Executive Search & Leadership
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    We partner with global organizations to identify, evaluate, and place executives at the CXO, VP, and Board levels. Our search methodology combines deep industry research with discrete sourcing to secure high-caliber leaders.
                  </p>
                  <ul className="space-y-2 text-xs font-bold text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Confidential Headhunting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Direct Boardroom Access
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Succession Planning
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-755 hover:underline uppercase tracking-wider">
                      Learn More About Directors <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/50 aspect-[16/10] w-full group hover:shadow-2xl transition-all duration-300">
                    <img
                      src="/images/executive_boardroom.png"
                      alt="Corporate meeting in board room"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Practice Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 lg:order-2 space-y-6">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">02 / Technology Resources</span>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-slate-900 leading-tight">
                    IT Services & Tech Staffing
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    From individual specialists to complete engineering pods, we provide developers across frontend, backend, mobile, and DevOps domains. Our candidates are thoroughly vetted for high-velocity software delivery.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["React Native", "Java", ".NET", "Full Stack", "DevOps", "SRE"].map((tech) => (
                      <span key={tech} className="bg-blue-50/80 text-blue-600 border border-blue-150 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link href="#it-services" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-755 hover:underline uppercase tracking-wider">
                      Browse Tech Professionals <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6 lg:order-1">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/50 aspect-[16/10] w-full group hover:shadow-2xl transition-all duration-300">
                    <img
                      src="/images/tech_collaboration.png"
                      alt="Tech team collaborating on whiteboard"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* Practice Row 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">03 / Scalable Team Mobilization</span>
                  <h3 className="text-2xl sm:text-3.5xl font-black text-slate-900 leading-tight">
                    High-Volume Talent Pipelines
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    At scale talent pipelines for large enterprise initiatives and operational expansions. Rapid matching algorithms paired with massive databases to source, screen, and select quality profiles.
                  </p>
                  {/* Rapid Mobilization Info Card */}
                  <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm max-w-sm flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-orange-50 text-[#f97316] flex items-center justify-center shrink-0">
                      <Zap className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Rapid Mobilization</h4>
                      <p className="text-[11px] font-semibold text-slate-500">Deploy 100+ talent profiles within weeks</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-755 hover:underline uppercase tracking-wider">
                      Request Expansion Plan <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/50 aspect-[16/10] w-full group hover:shadow-2xl transition-all duration-300">
                    <img
                      src="/images/office_lobby.png"
                      alt="Luxury office reception lobby"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ENTERPRISE IT SERVICES */}
        <section id="it-services" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 space-y-16">

            {/* Centered Heading */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Managed Tech Resources</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4.5xl leading-tight">
                Enterprise IT Services
              </h2>
              <p className="text-base font-medium text-slate-500 leading-relaxed">
                Deploy vetted technical talent through adaptable engagement frameworks that prioritize development velocity and architectural integrity.
              </p>
            </div>

            {/* IT Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="space-y-4">
                  <div className="size-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Briefcase className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Dedicated Tech Resource Staffing</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Immediate deployment of pre-vetted senior software developers, system architects, and tech leads directly into internal teams. Ideal for short-term project sprints and accelerating software release cycles.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-8 space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Technology Scope</span>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    React Native, .NET, Java, Full Stack, DevOps, SRE
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="space-y-4">
                  <div className="size-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Globe className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Tiered Commission Partnership</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Performance-linked staffing partnerships geared towards agencies, Managed Service Providers (MSPs), and systems integration partners looking to expand capability footprints dynamically without overhead bloat.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-8 space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Engagement Model</span>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    Tiered Commission, Sub-Contracting, Agency Partnerships
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="space-y-4">
                  <div className="size-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <MapPin className="size-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">Hybrid Offshore Engineering Pods</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Highly cost-effective, dedicated developer centers situated in India's leading innovation hubs. Access specialized talents with round-the-clock delivery overlaps and infrastructure support.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 mt-8 space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Primary Hubs</span>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1">
                    📍 Noida, Bangalore, Hyderabad, Pune
                  </p>
                </div>
              </div>

            </div>

            {/* Horizontal Team Collaboration Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 aspect-[21/9] max-h-[380px] w-full">
              <img
                src="/images/tech_collaboration.png"
                alt="Tech team collaborating on whiteboard"
                className="w-full h-full object-cover"
              />
            </div>

          </div>
        </section>

        {/* SECTION 4: SUCCESS-BASED RECRUITMENT MODEL */}
        <section id="commercial-model" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="bg-[#0f172a] text-white rounded-3xl p-8 sm:p-12 md:p-16 border border-slate-850 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

                {/* Left Column: Context and Small Lobby Image */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/35 text-blue-400 text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                      <DollarSign className="size-3" /> Risk-Free Partnerships
                    </span>
                    <h2 className="text-3xl font-black tracking-tight sm:text-4.5xl leading-tight !text-white">
                      Success-Based Recruitment Model
                    </h2>
                    <p className="text-slate-400 font-medium leading-relaxed text-sm max-w-xl">
                      We believe that you should only pay for proven results. Our commercial model aligns our performance with your candidate onboarding results. There are absolutely no upfront retainers or engagement fees.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Zero Upfront Cost</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Pay only when a candidate accepts your offer and completes their onboarding.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Transparent Success Rates</h4>
                        <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Book flat success based fees on role seniority and search complexity.</p>
                      </div>
                    </div>
                  </div>

                  {/* Office Lobby Image */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-xl aspect-[21/9] max-h-[220px] max-w-[450px] w-full">
                    <img
                      src="/images/office_lobby.png"
                      alt="Luxury office reception lobby"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Right Column: Rate Card */}
                <div className="lg:col-span-5 bg-white text-slate-900 p-8 rounded-3xl border border-slate-200/50 shadow-2xl space-y-6">
                  <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">Standard Rate Structure</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-500 font-semibold">Volume Staffing Contracts</span>
                      <span className="text-orange-600 font-extrabold bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">7% - 9%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium border-t border-slate-50 pt-3">
                      <span className="text-slate-500 font-semibold">Mid-Level & Technical Roles</span>
                      <span className="text-orange-600 font-extrabold bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">10% - 12%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium border-t border-slate-50 pt-3">
                      <span className="text-slate-500 font-semibold">C-Suite & Executive Search</span>
                      <span className="text-orange-600 font-extrabold bg-orange-50 border border-orange-100 px-3 py-1 rounded-lg">13% - 15%</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-100/50 rounded-2xl p-4 text-xs font-semibold text-orange-850 leading-relaxed flex gap-2">
                    <span className="text-base mt-[-2px]">💡</span>
                    <span>Placements are backed by our 90-day replacement guarantee framework for absolute hire assurance.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQS / ACCORDIONS */}
        <section id="faq" className="py-24 bg-slate-50/50 border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-200">
                <HelpCircle className="size-3.5" />
                Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4.5xl leading-tight">
                Recruitment Q&A details
              </h2>
            </div>

            {/* Interactive Custom Accordion */}
            <FaqAccordion faqData={faqData} />
          </div>
        </section>

        {/* SECTION 6: BLUE BANNER WITH GRID PATTERN */}
        <section className="bg-blue-600 text-white py-20 text-center relative overflow-hidden">
          {/* Blueprint style grid background pattern */}
          <div
            className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3rem_3rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-700/50 to-transparent" />

          <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight">
              Need Top-Tier Global Talent?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto font-medium text-sm sm:text-base leading-relaxed">
              Interview and hire offshore technology resource pods on a 100% success-backed model with zero setup fee.
            </p>
            <div className="pt-2 flex justify-center gap-4 flex-wrap">
              <Link href="/#contact">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/25 h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-transform">
                  Initiate Search
                </Button>
              </Link>
              <Link href="/#contact">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white h-12 px-6 font-bold text-xs uppercase tracking-wider rounded-xl bg-transparent hover:scale-105 active:scale-95 transition-transform">
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
