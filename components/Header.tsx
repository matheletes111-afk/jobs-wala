import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-utils";
import { ChevronDown } from "lucide-react";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60 shadow-sm backdrop-blur-md w-full">
      <div className="mx-auto flex h-16 w-full max-w-7xl min-w-0 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center">
          <div className="flex items-center justify-center shrink-0 h-10 md:h-12 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="Jobs Portal"
              className="h-[140%] w-auto max-w-none object-contain"
            />
          </div>
        </Link>
        {/* Right Aligned Container */}
        <div className="flex items-center gap-8">
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/about-us" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
              About
            </Link>

            {/* Services Dropdown */}
            <div className="relative group py-4">
              <span className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
                Services <ChevronDown className="h-3 w-3 text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
              </span>

              <div className="absolute right-0 top-full hidden group-hover:block w-[360px] bg-white border border-slate-100 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="space-y-4 text-left">
                  {/* Category 1: Talent Solutions */}
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Talent Solutions</p>
                    <div className="grid gap-0.5">
                      <Link href="/ats" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Enterprise ATS (Applicant Tracking System)
                      </Link>
                      <Link href="/executive-search" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Executive Search & Global Recruitment
                      </Link>
                      <Link href="/employer/jobs/new" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Post a Job
                      </Link>
                      <Link href="/user/jobs" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Job Portal
                      </Link>
                    </div>
                  </div>

                  {/* Category 2: Career Services */}
                  <div className="space-y-1 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Career Services</p>
                    <div className="grid gap-0.5">
                      <Link href="/career-services" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Develop your ATS friendly Avtar (Better Hikes/Fast Placements)
                      </Link>
                      <Link href="/career-services" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        LinkedIn Optimization
                      </Link>
                      <Link href="/career-services" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Interview Mock Drills
                      </Link>
                      <Link href="/career-services" className="block text-[14px] font-medium text-slate-700 hover:text-primary p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                        Hiring Assistance
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/faq" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link href="/contact-us" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Contact us
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/contact-us" className="hidden sm:inline-block">
              <Button variant="outline" className="h-10 px-5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 bg-white">
                Book A Demo
              </Button>
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="#free-trial" className="hidden xs:inline-block">
                  <Button className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                    Free trial
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-4">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:inline-block">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-5">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
