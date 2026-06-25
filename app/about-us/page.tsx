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
      accentColor: "text-blue-600 bg-blue-50",
      icon: Sparkles
    },
    {
      q: "What is the corporate philosophy behind JobDaddy?",
      a: "JobDaddy operates on the 'Wolf of the Job Street' mandate: every talent acquisition decision is a competitive business action, not an administrative task. We combine AI-powered candidate matching with human recruitment expertise to help enterprises hire the top 1% of candidates before competitors complete their first screening call. Unlike passive ATS databases, JobDaddy is engineered as an active revenue-generating hiring engine with zero friction between job posting and candidate placement.",
      gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
      borderColor: "border-orange-200/60 hover:border-orange-500",
      accentColor: "text-orange-600 bg-orange-50",
      icon: Target
    },
    {
      q: "Where is JobDaddy located and which markets does it serve?",
      a: "JobDaddy is headquartered in Greater Noida, Uttar Pradesh, India, and delivers global recruitment services across four key markets: India (pan-India coverage including Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune), the United States, the United Kingdom, and the Gulf region (UAE, Saudi Arabia, Qatar). The platform serves IT companies, recruitment agencies, SaaS enterprises, and individual professionals across all experience levels.",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      borderColor: "border-emerald-200/60 hover:border-emerald-500",
      accentColor: "text-emerald-600 bg-emerald-50",
      icon: MapPin
    },
    {
      q: "How does JobDaddy differentiate from traditional recruitment ATS?",
      a: "JobDaddy differs from traditional recruitment agencies in three measurable ways: first, a 48-hour candidate matching window versus the industry average of 14-21 days; second, AI semantic matching that eliminates 70% of manual screening overhead versus keyword-only ATS systems; third, a success-based pricing model with zero upfront costs for enterprise clients. JobDaddy is the only ATS platform in India built and operated by a working global recruitment practitioner with 15+ years of hands-on experience.",
      gradient: "from-purple-500/10 via-violet-500/5 to-transparent",
      borderColor: "border-purple-200/60 hover:border-purple-500",
      accentColor: "text-purple-600 bg-purple-50",
      icon: Zap
    },
    {
      q: "How do I find and apply for jobs on JobDaddy?",
      a: "To find jobs on JobDaddy: visit the Job Portal section, browse current active openings filtered by role, location, stack, or country, and click Apply Now to be routed to the registration page. Registration is free for all job seekers. Once registered, your profile is added to the JobDaddy talent pool, making you discoverable by enterprise clients and global recruiters actively using the platform. Active openings include IT roles across India, UK, USA, and Gulf markets.",
      gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
      borderColor: "border-pink-200/60 hover:border-pink-500",
      accentColor: "text-pink-600 bg-pink-50",
      icon: Search
    },
    {
      q: "What types of jobs are available on the JobDaddy portal?",
      a: "JobDaddy's job portal lists curated openings across four primary categories: IT and software development roles (Java, React Native, .NET, Angular, DevOps, Cloud, SRE), Executive and leadership positions (CTOs, engineering heads, director-level roles), International opportunities (UK, USA, and Gulf region postings for senior professionals), and Contract/remote engagements (12-month contracts, remote roles, and hybrid positions). All listings are verified and directly managed by the JobDaddy recruitment team.",
      gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
      borderColor: "border-indigo-200/60 hover:border-indigo-500",
      accentColor: "text-indigo-600 bg-indigo-50",
      icon: LayoutGrid
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
        {/* Decorative background blobs */}
        <div className="absolute right-[5%] top-[12%] w-[550px] h-[550px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute left-[-10%] top-[40%] w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Section */}
        <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-12 sm:px-6 md:px-8 lg:px-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 justify-between">
            {/* Text Column */}
            <div className="max-w-2xl flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6 border border-blue-200">
                <Sparkles className="size-3.5" />
                Next-Gen Recruitment Platform
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight mb-6">
                Wolf of the <br />
                <span className="text-blue-600">Job Street.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium mb-8">
                JobDaddy combines advanced AI-powered applicant matching with deep recruitment expertise to bridge the gap between ambitious professionals and high-growth enterprises. Reach the top 1% of talent globally in record time.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="/user/jobs">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider">
                    Explore Jobs <ArrowRight className="size-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/#contact">
                  <Button variant="outline" className="border-slate-350 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all rounded-xl h-12 px-6 font-bold text-xs uppercase tracking-wider text-slate-700 bg-white">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image Column */}
            <div className="relative w-full max-w-md lg:max-w-lg shrink-0 aspect-[4/3] flex items-center justify-center">
              <div className="absolute w-[95%] aspect-square rounded-full bg-gradient-to-tr from-sky-200/50 via-blue-100/40 to-transparent border-2 border-white/60 shadow-xl blur-sm pointer-events-none -z-10" />
              
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(37,99,235,0.12)] border-4 border-white group transition-all duration-500 hover:scale-[1.02]">
                <Image
                  src="/images/about_hero.png"
                  alt="JobDaddy AI Talent Ecosystem"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 500px"
                  priority
                />
              </div>

              {/* Floating badges on image */}
              <div className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-100 shadow-lg flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <span className="size-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-sm">1%</span>
                <span className="text-[10px] font-bold text-slate-700">Top 1% Talent Pool</span>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-slate-100 shadow-lg flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                <span className="size-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">48h</span>
                <span className="text-[10px] font-bold text-slate-700">Match Speed Guarantee</span>
              </div>
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

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {faqs.map((faq, idx) => {
              const IconComponent = faq.icon;
              return (
                <div 
                  key={idx}
                  className={`relative rounded-3xl p-6 border bg-gradient-to-br bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(15,23,42,0.06)] group flex flex-col justify-between ${faq.borderColor} ${faq.gradient}`}
                >
                  <div>
                    {/* Header: Icon & Question */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex items-center justify-center size-10 rounded-xl shrink-0 transition-colors group-hover:scale-110 duration-300 ${faq.accentColor}`}>
                        <IconComponent className="size-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {faq.q}
                      </h3>
                    </div>

                    {/* Answer */}
                    <p className="text-xs text-slate-650 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  </div>

                  {/* Decorative index indicator */}
                  <div className="mt-6 pt-4 border-t border-slate-100/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>JOBDADDY AI FAQ</span>
                    <span>0{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
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
              <Link href="/user/jobs">
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
