"use client";

import Link from "next/link";
import React, { useState } from "react";
import { 
  ChevronDown, 
  HelpCircle, 
  Search, 
  Sparkles,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Compass,
  MapPin,
  Mail,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FaqClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeGlossary, setActiveGlossary] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "career" | "ats">("all");

  const faqs = [
    {
      q: "How do I improve my resume ATS score?",
      a: "To improve your resume ATS score: (1) use the exact job title from the job description in your resume headline, (2) include keywords from the job posting naturally throughout your experience section, (3) use standard section headings (Experience, Education, Skills — not creative alternatives), (4) avoid tables, graphics, and text boxes that ATS parsers cannot read, (5) save in .docx or .pdf format, and (6) quantify every achievement with numbers. JobDaddy's resume enhancement service handles all of these optimisations starting at ₹999, with results visible within 48-72 hours.",
      category: "career",
    },
    {
      q: "How long does JobDaddy's resume enhancement service take?",
      a: "JobDaddy delivers enhanced resumes within 48-72 hours of receiving your existing resume and target role information via the free assessment form. The process: (1) submit free assessment form (2 minutes), (2) receive expert review and service recommendation within 2 hours, (3) confirm service and provide payment, (4) receive completed enhanced resume within 48-72 hours, (5) request one round of revisions if needed at no additional cost.",
      category: "career",
    },
    {
      q: "Is JobDaddy's career counselling available for professionals outside India?",
      a: "Yes. JobDaddy's career counselling sessions are available to professionals globally via video call. Sessions are particularly valuable for Indian professionals targeting roles in the UK, USA, Gulf, or Europe, as the counsellor (Tarun Upadhyay) has 15+ years of active hiring experience in all four markets and can provide accurate, current salary benchmarks, visa considerations, and market-specific positioning advice. Sessions are priced at ₹1,499 and conducted in English.",
      category: "career",
    },
    {
      q: "What salary increase can I expect after using JobDaddy's resume and career services?",
      a: "JobDaddy career service clients report an average salary increase of 30-70% when changing roles following resume enhancement and career counselling. Mid-level IT professionals (3-8 years experience) typically achieve 30-45% hikes. Senior professionals (8+ years) targeting international roles in UK, USA, or Gulf report 50-70% compensation improvements. Results depend on market conditions, skills, and target role — JobDaddy provides realistic salary benchmarking during the free assessment call.",
      category: "career",
    },
    {
      q: "What is the best ATS software for recruitment agencies in India?",
      a: "For recruitment agencies in India, the best ATS software depends on agency size: independent recruiters and boutiques benefit most from platforms offering automated resume parsing, simple pipeline views, and job board integrations; high-volume agencies need programmatic XML multi-posting, AI semantic matching, and unlimited active pipelines; large enterprises require custom API access, cloud telephony, and dedicated account management. JobDaddy's ATS addresses all three tiers through its Growth, Pro, and Corporate Scale plans, with a 14-day free trial available for direct comparison against existing tools.",
      category: "ats",
    },
    {
      q: "How does JobDaddy's ATS compare to Zoho Recruit and other platforms?",
      a: "JobDaddy ATS differs from Zoho Recruit and other generic ATS platforms in three key areas: (1) AI Semantic Matching — JobDaddy parses career trajectory and skills context rather than keywords, reducing false positives by 60%; (2) Programmatic XML Multi-Posting — native broadcasting to hundreds of job boards versus manual posting in most standard ATS platforms; (3) Founder Expertise — built and operated by an active global recruiter with 15+ years of placement experience, meaning the platform is designed around actual hiring workflows, not theoretical frameworks. A 14-day free trial allows direct side-by-side comparison.",
      category: "ats",
    },
    {
      q: "How quickly can an enterprise onboard onto the JobDaddy ATS?",
      a: "Enterprise teams transition to JobDaddy ATS within 24 hours. The onboarding process: (1) account setup and user access configuration (1-2 hours), (2) existing candidate pipeline import via CSV or ATS data export (2-4 hours), (3) job template creation and job board integration setup (1-2 hours), (4) team training via guided demo call (45-60 minutes). A dedicated account success manager is assigned to Corporate Scale clients for the full onboarding process.",
      category: "ats",
    },
    {
      q: "Does JobDaddy offer recruitment services for IT companies in Greater Noida and Delhi NCR?",
      a: "Yes. JobDaddy is headquartered in Greater Noida and has deep recruitment networks across the Delhi NCR technology corridor, including Noida Sector 62, Sector 63, Sector 125, and the Greater Noida West technology parks. The platform specialises in placing Java developers, React Native engineers, .NET specialists, DevOps engineers, and full-stack developers for IT companies in the region. Enterprise clients in Greater Noida and Delhi NCR also benefit from on-site recruitment support and BNI network referrals managed by the founding team.",
      category: "ats",
    },
  ];

  const glossaryItems = [
    {
      term: "What is an Applicant Tracking System (ATS)?",
      definition: "An Applicant Tracking System (ATS) is software used by employers to collect, organise, and filter job applications. ATS software automatically screens resumes for keywords, formatting, and qualifications before human recruiters review them. Approximately 98% of Fortune 500 companies and 75% of all medium and large employers use ATS software. Resumes that do not meet ATS formatting and keyword requirements are automatically rejected — often without a human ever reading them.",
    },
    {
      term: "What is programmatic job posting?",
      definition: "Programmatic job posting is the automated distribution of job listings across multiple job boards, aggregators, and professional networks simultaneously using XML feed technology. Rather than manually posting a vacancy to each platform, programmatic posting broadcasts the opening to hundreds of channels in seconds, optimising spend and visibility based on real-time performance data. JobDaddy's ATS includes native programmatic XML multi-posting across global and India-specific job boards.",
    },
    {
      term: "What is semantic AI matching in recruitment?",
      definition: "Semantic AI matching in recruitment is a candidate screening approach that analyses the meaning and context of a candidate's experience, not just keyword matches. Unlike traditional ATS keyword filtering (which rejects a 'Java developer' resume that says 'J2EE' instead of 'Java'), semantic matching understands that both terms describe the same skill. JobDaddy's AI semantic matching engine eliminates 70% of manual screening overhead by surfacing contextually relevant candidates that keyword-only systems miss.",
    },
    {
      term: "What is a success-based recruitment fee?",
      definition: "A success-based recruitment fee is a payment model where a recruitment agency charges a percentage of the placed candidate's salary only after a successful hire is confirmed. There are no upfront costs, retainers, or fees for unsuccessful searches. JobDaddy charges success-based fees ranging from 7% to 15% of first-year compensation, depending on role seniority and engagement complexity. This model aligns the agency's commercial interest with the quality of each placement.",
    },
  ];

  // Filtering
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || faq.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const filteredGlossary = glossaryItems.filter((item) => {
    return (
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const toggleGlossary = (idx: number) => {
    setActiveGlossary(activeGlossary === idx ? null : idx);
  };

  return (
    <div className="flex-1 relative bg-transparent overflow-x-hidden">
      {/* Decorative background blobs */}
      <div className="absolute right-[5%] top-[8%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute left-[-10%] top-[30%] w-[450px] h-[450px] bg-orange-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto px-4 pt-16 pb-8 text-center sm:px-6 md:px-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4 border border-blue-200/60">
          <Sparkles className="size-3.5" />
          Knowledge Base & Resources
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-4">
          Frequently Asked <span className="text-blue-600">Questions</span>
        </h1>
        <p className="text-base text-slate-650 font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
          Find answers to common questions about JobDaddy's ATS platform, resume enhancement, career counselling, and recruiting services.
        </p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search questions, keywords, glossary terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-md font-semibold transition-all text-sm"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {[
            { id: "all", label: "All Questions" },
            { id: "career", label: "Career Services" },
            { id: "ats", label: "ATS & Recruitment" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setActiveFaq(null);
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* FAQs Accordion Section */}
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:px-6">
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${faq.category === "career" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"}`}>
                        <HelpCircle className="size-4.5" />
                      </div>
                      <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-snug">
                        {faq.q}
                      </span>
                    </div>
                    <ChevronDown
                      className={`size-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[300px] border-t border-slate-100" : "max-h-0"
                    } overflow-hidden`}
                  >
                    <div className="px-6 py-5 bg-slate-50/50">
                      <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-semibold text-sm">No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Glossary & Career Terms Section */}
      <section className="max-w-4xl mx-auto px-4 pb-20 sm:px-6">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-bold mb-3 border border-orange-200/60">
            <BookOpen className="size-3.5" />
            Recruitment & Career Glossary
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Glossary of Key Terms
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2 max-w-xl mx-auto">
            Plain-language definitions of key recruitment and career terms, optimized for voice search and AI citations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGlossary.length > 0 ? (
            filteredGlossary.map((item, idx) => {
              const isOpen = activeGlossary === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-250/60 p-6 shadow-sm hover:shadow-md transition-all hover:border-slate-350"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="size-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                      {item.term}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                    {item.definition}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-semibold text-sm">No glossary terms found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA section */}
      <section className="max-w-5xl mx-auto px-4 pb-16 sm:px-6">
        <div className="bg-blue-600 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 relative z-10">
            Still Have Questions?
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 font-semibold max-w-xl mx-auto mb-8 relative z-10 leading-relaxed">
            Our career consultants and support executives are here to guide you. Contact us directly for customized guidance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <Link href="/contact-us">
              <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                Get in Touch <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/career-services">
              <Button variant="outline" className="border-white/30 text-white bg-transparent hover:bg-white/10 font-bold text-xs uppercase tracking-wider h-11 px-6 rounded-xl transition-all hover:scale-105 active:scale-95">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
