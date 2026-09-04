import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Sparkles,
  Rocket,
  BookOpen,
  Award,
  Video,
  CheckCircle2,
  ArrowRight,
  Briefcase,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Learning Hub - JobDaddy",
  description: "Accelerate your career with curated industry courses, interview bootcamps, and skill certifications. Launching soon.",
};

export default function LearningHubPage() {
  const tracks = [
    {
      title: "AI Resume & ATS Optimization",
      desc: "Learn the art of beating ATS algorithms and structuring resumes for Tier-1 companies.",
      duration: "4 Modules",
      level: "All Levels",
      icon: Layers,
      tag: "Popular",
    },
    {
      title: "Executive & Tech Interview Masterclass",
      desc: "Crack system design, behavioral rounds, and live technical coding assessments.",
      duration: "6 Modules",
      level: "Intermediate - Advanced",
      icon: Video,
      tag: "Live Bootcamp",
    },
    {
      title: "Salary Negotiation & Offer Evaluation",
      desc: "Proven frameworks to negotiate 30-50% CTC hikes without losing job offers.",
      duration: "3 Modules",
      level: "All Levels",
      icon: Award,
      tag: "Career Growth",
    },
    {
      title: "AI Skills for 2026 Workplace",
      desc: "Master generative AI workflows, prompt engineering, and modern tool stacks.",
      duration: "5 Modules",
      level: "Beginner - Pro",
      icon: Sparkles,
      tag: "New",
    },
  ];

  return (
    <div className="w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        {/* Page Header */}
        <div className="mb-10 border-b border-slate-200/60 pb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Rocket className="h-3.5 w-3.5 text-amber-600" />
              Launching Soon
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            My Learning Hub
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 max-w-2xl leading-relaxed">
            Upskill, get certified, and prepare for top-tier global interviews with JobDaddy’s upcoming career accelerator courses.
          </p>
        </div>

        {/* Hero Banner with High Contrast & Premium Aesthetics */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-12 shadow-2xl mb-12 border border-slate-800">
          <div className="absolute right-[-5%] top-[-10%] w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-[15%] bottom-[-20%] w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold mb-5 shadow-sm">
              <GraduationCap className="h-4 w-4 text-amber-400" />
              <span style={{ color: "#fef08a" }}>Next-Gen Career Academy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-snug">
              <span style={{ color: "#ffffff" }}>Transform from Applicant to the </span>
              <span style={{ color: "#fbbf24" }}>#1 Candidate</span>
            </h2>
            <p className="text-sm sm:text-base mb-8 leading-relaxed font-medium" style={{ color: "#e2e8f0" }}>
              We are finalizing partnerships with top hiring managers and industry experts to bring you high-impact masterclasses, mock interviews, and certifications.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="https://forms.gle/N3RjJVVzBC5xQ6eY9"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30">
                  <span style={{ color: "#ffffff" }}>Request Early Access</span>
                </Button>
              </a>
              <Link href="/user/jobs">
                <Button className="h-11 px-6 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all shadow-md">
                  <span style={{ color: "#0f172a" }}>Browse Open Jobs</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Courses Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Upcoming Learning Tracks</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">Preview of curated tracks rolling out in Phase 1</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.title}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      {track.tag}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {track.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-5">
                    {track.desc}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      {track.duration}
                    </span>
                    <span className="text-slate-500">{track.level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits preview */}
        <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 border border-blue-100/80 rounded-2xl p-6 sm:p-8">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Included in JobDaddy Candidate Benefits
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2 bg-white/90 p-3 rounded-xl border border-slate-200/60 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Free for active job applicants</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 p-3 rounded-xl border border-slate-200/60 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Direct mentor reviews</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 p-3 rounded-xl border border-slate-200/60 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Verified skill badges on profile</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
