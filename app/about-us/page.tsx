import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import { 
  ChevronDown, 
  Sparkles, 
  Cpu, 
  HelpCircle, 
  Target, 
  MapPin, 
  Zap, 
  ShieldCheck,
  Search, 
  Users, 
  ArrowRight,
  TrendingUp,
  LayoutGrid
} from "lucide-react";
import AboutFaqClient from "@/components/AboutFaqClient";

export const metadata = {
  title: "About Us - JobDaddy AI ATS",
  description: "Learn about JobDaddy, the AI-powered applicant tracking system (ATS) and holistic talent ecosystem founded by Tarun Upadhyay.",
};

export default async function AboutUsPage() {
  const user = await getCurrentUser();

  const faqs = [
    {
      q: "What is JobDaddy and who founded the platform?",
      a: "JobDaddy is an AI-powered applicant tracking system (ATS) and holistic talent ecosystem founded by Tarun Upadhyay, a global recruitment expert with 15+ years of experience across the USA, UK, Europe, India, and the Gulf. JobDaddy replaces legacy recruitment systems with automated, 48-hour candidate matching, programmatic job broadcasting, and AI semantic screening serving both ambitious professionals and high-growth enterprises from its headquarters in Greater Noida, India.",
      gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
      borderColor: "border-blue-200/60 hover:border-blue-500",
      accentColor: "text-blue-600 bg-blue-50/50",
      iconName: "Sparkles",
      image: "/images/faq_card_1.png"
    },
    {
      q: "What is the corporate philosophy behind JobDaddy?",
      a: "JobDaddy operates on the 'Wolf of the Job Street' mandate: every talent acquisition decision is a competitive business action, not an administrative task. We combine AI-powered candidate matching with human recruitment expertise to help enterprises hire the top 1% of candidates before competitors complete their first screening call. Unlike passive ATS databases, JobDaddy is engineered as an active revenue-generating hiring engine with zero friction between job posting and candidate placement.",
      gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
      borderColor: "border-orange-200/60 hover:border-orange-500",
      accentColor: "text-orange-600 bg-orange-50/50",
      iconName: "Target",
      image: "/images/faq_card_2.png"
    },
    {
      q: "Where is JobDaddy located and which markets does it serve?",
      a: "JobDaddy is headquartered in Greater Noida, Uttar Pradesh, India, and delivers global recruitment services across four key markets: India (pan-India coverage including Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune), the United States, the United Kingdom, and the Gulf region (UAE, Saudi Arabia, Qatar). The platform serves IT companies, recruitment agencies, SaaS enterprises, and individual professionals across all experience levels.",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      borderColor: "border-emerald-200/60 hover:border-emerald-500",
      accentColor: "text-emerald-600 bg-emerald-50/50",
      iconName: "MapPin",
      image: "/images/faq_card_3.png"
    },
    {
      q: "How does JobDaddy differentiate from traditional recruitment ATS?",
      a: "JobDaddy differs from traditional recruitment agencies in three measurable ways: first, a 48-hour candidate matching window versus the industry average of 14-21 days; second, AI semantic matching that eliminates 70% of manual screening overhead versus keyword-only ATS systems; third, a success-based pricing model with zero upfront costs for enterprise clients. JobDaddy is the only ATS platform in India built and operated by a working global recruitment practitioner with 15+ years of hands-on experience.",
      gradient: "from-purple-500/10 via-violet-500/5 to-transparent",
      borderColor: "border-purple-200/60 hover:border-purple-500",
      accentColor: "text-purple-600 bg-purple-50/50",
      iconName: "Zap",
      image: "/images/faq_card_4.png"
    },
    {
      q: "How do I find and apply for jobs on JobDaddy?",
      a: "To find jobs on JobDaddy: visit the Job Portal section, browse current active openings filtered by role, location, stack, or country, and click Apply Now to be routed to the registration page. Registration is free for all job seekers. Once registered, your profile is added to the JobDaddy talent pool, making you discoverable by enterprise clients and global recruiters actively using the platform. Active openings include IT roles across India, UK, USA, and Gulf markets.",
      gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
      borderColor: "border-pink-200/60 hover:border-pink-500",
      accentColor: "text-pink-600 bg-pink-50/50",
      iconName: "Search",
      image: "/images/faq_card_5.png"
    },
    {
      q: "What types of jobs are available on the JobDaddy portal?",
      a: "JobDaddy's job portal lists curated openings across four primary categories: IT and software development roles (Java, React Native, .NET, Angular, DevOps, Cloud, SRE), Executive and leadership positions (CTOs, engineering heads, director-level roles), International opportunities (UK, USA, and Gulf region postings for senior professionals), and Contract/remote engagements (12-month contracts, remote roles, and hybrid positions). All listings are verified and directly managed by the JobDaddy recruitment team.",
      gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
      borderColor: "border-indigo-200/60 hover:border-indigo-500",
      accentColor: "text-indigo-600 bg-indigo-50/50",
      iconName: "LayoutGrid",
      image: "/images/faq_card_6.png"
    }
  ];

  const badges = [
    { text: "Wolf of Job Street Mandate", color: "bg-orange-50 text-orange-700 border-orange-200/80" },
    { text: "AI Semantic Screening", color: "bg-blue-50 text-blue-700 border-blue-200/80" },
    { text: "48-Hour Talent Match", color: "bg-emerald-50 text-emerald-700 border-emerald-200/80" },
    { text: "Global Recruitment Expertise", color: "bg-purple-50 text-purple-700 border-purple-200/80" },
    { text: "Premium UI & Experience", color: "bg-pink-50 text-pink-700 border-pink-200/80" },
    { text: "Zero Upfront Cost", color: "bg-indigo-50 text-indigo-700 border-indigo-200/80" }
  ];

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col bg-transparent selection:bg-primary/20">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 relative bg-transparent overflow-x-hidden">
        {/* HERO SECTION (Dark Navy with Image Banner matching ATS Page UI) */}
        <section
          style={{ backgroundColor: '#090d16', color: '#ffffff' }}
          className="relative min-h-[85vh] flex items-center border-b border-slate-800 overflow-hidden"
        >

          {/* Full-width Banner Image Background */}
          <div
            className="absolute inset-0 bg-cover bg-left opacity-90 pointer-events-none"
            style={{ backgroundImage: `url('/images/about_hero.png')`, backgroundPosition: 'left center' }}
          />

          {/* Light Left Gradient for Text Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/95 via-[#090d16]/70 to-transparent pointer-events-none" />

          {/* Right Background Typography overlay - Scaled to fit 100% inside viewport without clipping */}
          <div 
            style={{ color: 'rgba(255, 255, 255, 0.35)' }}
            className="absolute right-6 lg:right-16 top-1/2 -translate-y-1/2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-wider uppercase select-none hidden md:block pointer-events-none leading-none max-w-xs sm:max-w-sm md:max-w-md text-right z-0"
          >
            ABOUT US <br />
            <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255, 255, 255, 0.55)', display: 'block', marginTop: '8px' }}>
              GLOBAL TALENT ECOSYSTEM
            </span>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 md:px-8 lg:px-10 z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column Content */}
              <div className="lg:col-span-7 space-y-6 max-w-xl">
                
                {/* Tagline Badge */}
                <div 
                  style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(51, 65, 85, 0.8)' }}
                  className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full border backdrop-blur-md"
                >
                  <span style={{ backgroundColor: '#ff5722' }} className="w-2.5 h-2.5 rounded-full animate-pulse" />
                  <span style={{ color: '#ff5722', fontWeight: 800, letterSpacing: '0.22em', fontSize: '10px', textTransform: 'uppercase' }}>
                    NEXT-GEN RECRUITMENT PLATFORM
                  </span>
                </div>

                {/* Main Hero Header */}
                <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-extrabold tracking-tight leading-[1.06]">
                  <span style={{ color: '#ffffff' }}>Wolf of the</span> <br />
                  <span style={{ color: '#ff5722', textShadow: '0 2px 8px rgba(255,87,34,0.3)' }}>
                    Job Street.
                  </span>
                </h1>

                {/* Paragraph Content inside floating dark container matching exact ATS card */}
                <div 
                  style={{ backgroundColor: 'rgba(20, 30, 48, 0.95)', borderColor: 'rgba(51, 65, 85, 0.7)', borderRadius: '16px', padding: '20px 24px' }}
                  className="border shadow-2xl max-w-xl backdrop-blur-md"
                >
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    JobDaddy combines advanced AI-powered applicant matching with deep recruitment expertise to bridge the gap between ambitious professionals and high-growth enterprises. Reach the top 1% of talent globally in record time.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="/jobs/browse">
                    <Button 
                      style={{ backgroundColor: '#ff5722', color: '#ffffff', border: 'none', borderRadius: '12px', padding: '0 32px', height: '48px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      className="shadow-xl shadow-orange-500/30 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      EXPLORE JOBS <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href="/contact-us">
                    <Button 
                      style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '12px', padding: '0 26px', height: '48px', fontWeight: 800, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                      className="transition-transform hover:scale-105 active:scale-95"
                    >
                      CONTACT US
                    </Button>
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Three Alternating Content Blocks */}
        <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 md:px-8 lg:px-10 space-y-24">
          
          {/* Block 1: Founder & Story */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="relative w-full lg:w-[45%] shrink-0 aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-100/50 bg-white p-2">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src="/images/about_us_founder.png"
                  alt="Tarun Upadhyay - Founder"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-3 block">01 / The Founder</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Our Founding & Vision</h2>
              <p className="text-base text-slate-650 leading-relaxed font-semibold mb-6">
                JobDaddy is an AI-powered applicant tracking system (ATS) and holistic talent ecosystem founded by Tarun Upadhyay, a global recruitment expert with 15+ years of experience across the USA, UK, Europe, India, and the Gulf. 
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                JobDaddy replaces legacy recruitment systems with automated, 48-hour candidate matching, programmatic job broadcasting, and AI semantic screening, serving both ambitious professionals and high-growth enterprises from its headquarters in Greater Noida, India.
              </p>
            </div>
          </div>

          {/* Block 2: Philosophy & AI */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="relative w-full lg:w-[45%] shrink-0 aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-100/50 bg-white p-2">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src="/images/about_us_ai_match.png"
                  alt="AI Screening Dashboard"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-3 block">02 / The Mandate</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">The "Wolf of Job Street" Mandate</h2>
              <p className="text-base text-slate-650 leading-relaxed font-semibold mb-6">
                JobDaddy operates on the &quot;Wolf of the Job Street&quot; mandate: every talent acquisition decision is a competitive business action, not an administrative task.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                We combine AI-powered candidate matching with human recruitment expertise to help enterprises hire the top 1% of candidates before competitors complete their first screening call. Unlike passive ATS databases, JobDaddy is engineered as an active, revenue-generating hiring engine with zero friction between job posting and candidate placement.
              </p>
            </div>
          </div>

          {/* Block 3: Global Reach */}
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="relative w-full lg:w-[45%] shrink-0 aspect-[4/3] rounded-3xl overflow-hidden shadow-lg border border-slate-100/50 bg-white p-2">
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image
                  src="/images/about_us_global.png"
                  alt="Global Hiring Map"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-3 block">03 / Global Presence</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">Global Reach & Markets</h2>
              <p className="text-base text-slate-650 leading-relaxed font-semibold mb-6">
                Headquartered in Greater Noida, Uttar Pradesh, India, JobDaddy delivers global recruitment services across four key markets: India, the United States, the United Kingdom, and the Gulf region.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our pan-India coverage spans Delhi NCR, Mumbai, Bangalore, Hyderabad, and Pune. Serving IT companies, recruitment agencies, SaaS enterprises, and individual professionals across all experience levels, JobDaddy is the only ATS platform in India built and operated by a working global recruitment practitioner.
              </p>
            </div>
          </div>

        </section>

        {/* Badges Ribbon Section */}
        <section className="bg-slate-50/50 border-y border-slate-100 py-8 my-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Built with Excellence & Impact</p>
            <div className="flex flex-wrap justify-center gap-3">
              {badges.map((badge, idx) => (
                <span 
                  key={idx} 
                  className={`px-4 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all hover:scale-105 hover:shadow-sm duration-300 ${badge.color}`}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Card System Section */}
        <section className="max-w-7xl mx-auto px-4 py-16 sm:px-6 md:px-8 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-4">
              Everything You Need to Know
            </h2>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Direct Answers to Key Questions
            </p>
          </div>

          <AboutFaqClient faqs={faqs} />
        </section>

        {/* CTA section */}
        <section className="max-w-7xl mx-auto px-4 py-8 mb-16 sm:px-6 md:px-8 lg:px-10">
          <div className="bg-blue-600 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
            
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 relative z-10">
              Ready to Accelerate Your Recruitment Journey?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-semibold max-w-xl mx-auto mb-8 relative z-10 leading-relaxed">
              Whether you are an ambitious enterprise looking for premium candidates, or a talented developer searching for the perfect opportunity, JobDaddy is here to make it happen.
            </p>
            <div className="flex flex-wrap gap-4 justify-center relative z-10">
              <Link href="/register">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/jobs/browse">
                <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                  Browse Openings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
