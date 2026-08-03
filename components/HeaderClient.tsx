"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, Menu, X, Sparkles, Phone, HelpCircle, Info, Search, Briefcase } from "lucide-react";

interface HeaderClientProps {
  user: {
    id: string;
    role?: string;
  } | null;
}

export default function HeaderClient({ user }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(event.target as Node)
      ) {
        setServicesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileServicesOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60 shadow-sm backdrop-blur-md w-full">
      <div className="mx-auto flex h-20 w-full max-w-7xl min-w-0 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" onClick={closeMobileMenu} className="flex shrink-0 items-center">
          <div className="flex items-center justify-center shrink-0 h-14 md:h-16 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="Jobdaddy"
              className="h-[200%] w-auto max-w-none object-contain"
            />
          </div>
        </Link>

        {/* Right Aligned Container: Desktop Nav + Actions */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              href="/jobs/browse"
              className="text-xs lg:text-sm font-semibold text-slate-700 hover:text-primary transition-colors flex items-center gap-1"
            >
              Find Jobs
            </Link>

            <Link
              href="/about-us"
              className="text-xs lg:text-sm font-semibold text-slate-700 hover:text-primary transition-colors flex items-center gap-1"
            >
              About
            </Link>

            {/* Services Dropdown */}
            <div
              className="relative py-4"
              ref={servicesDropdownRef}
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button
                onClick={() => setServicesDropdownOpen((prev) => !prev)}
                className="text-xs lg:text-sm font-semibold text-slate-700 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
              >
                Services{" "}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-300 ${
                    servicesDropdownOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {servicesDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-[360px] bg-white border border-slate-150 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="space-y-4 text-left">
                    {/* Category 1: Talent Solutions */}
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Talent Solutions
                      </p>
                      <div className="grid gap-0.5">
                        <Link
                          href="/ats"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Enterprise ATS (Applicant Tracking)
                        </Link>
                        <Link
                          href="/executive-search"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Executive Search & Global Recruitment
                        </Link>
                        <Link
                          href="/employer/jobs/new"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Post a Job
                        </Link>
                        <Link
                          href="/jobs/browse"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Job Portal
                        </Link>
                      </div>
                    </div>

                    {/* Category 2: Career Services */}
                    <div className="space-y-1 pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Career Services
                      </p>
                      <div className="grid gap-0.5">
                        <Link
                          href="/career-services"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          ATS Friendly Resume Development
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          LinkedIn Optimization
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Interview Mock Drills
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={() => setServicesDropdownOpen(false)}
                          className="block text-[13px] font-semibold text-slate-700 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Hiring Assistance
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/faq"
              className="text-xs lg:text-sm font-semibold text-slate-700 hover:text-primary transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/contact-us"
              className="text-xs lg:text-sm font-semibold text-slate-700 hover:text-primary transition-colors"
            >
              Contact us
            </Link>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link href="/contact-us">
              <Button
                variant="outline"
                className="h-10 px-4 lg:px-5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 bg-white shadow-xs"
              >
                Book A Demo
              </Button>
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-4 lg:px-5">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="#free-trial" className="hidden lg:inline-block">
                  <Button className="bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-4 lg:px-5">
                    Free trial
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-3.5"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 rounded-xl font-bold text-xs uppercase tracking-wider h-10 px-4 lg:px-5">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-x-0 top-20 z-40 flex flex-col bg-white border-b border-slate-200 shadow-2xl animate-in slide-in-from-top duration-300 md:hidden"
          style={{ height: "calc(100vh - 5rem)" }}
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <nav className="flex flex-col gap-2">
              <Link
                href="/jobs/browse"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <Search className="h-4 w-4 text-emerald-600" />
                Find Jobs
              </Link>

              <Link
                href="/about-us"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <Info className="h-4 w-4 text-blue-600" />
                About Us
              </Link>

              {/* Collapsible Services Section */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
                <button
                  onClick={() => setMobileServicesOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-100/70 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Services
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                      mobileServicesOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                  />
                </button>

                {mobileServicesOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-200/60 bg-white">
                    {/* Talent Solutions */}
                    <div className="space-y-1.5 pt-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Talent Solutions
                      </p>
                      <div className="grid gap-1 pl-2">
                        <Link
                          href="/ats"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Enterprise ATS
                        </Link>
                        <Link
                          href="/executive-search"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Executive Search
                        </Link>
                        <Link
                          href="/employer/jobs/new"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Post a Job
                        </Link>
                        <Link
                          href="/jobs/browse"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Job Portal
                        </Link>
                      </div>
                    </div>

                    {/* Career Services */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Career Services
                      </p>
                      <div className="grid gap-1 pl-2">
                        <Link
                          href="/career-services"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • ATS Resume Optimization
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • LinkedIn Optimization
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Interview Mock Drills
                        </Link>
                        <Link
                          href="/career-services"
                          onClick={closeMobileMenu}
                          className="block text-xs font-semibold text-slate-700 py-1.5 hover:text-blue-600"
                        >
                          • Hiring Assistance
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/faq"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-violet-600" />
                FAQ
              </Link>

              <Link
                href="/contact-us"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <Phone className="h-4 w-4 text-orange-600" />
                Contact Us
              </Link>
            </nav>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              <Link href="/contact-us" onClick={closeMobileMenu}>
                <Button variant="outline" className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider border-slate-300">
                  Book A Demo
                </Button>
              </Link>

              {user ? (
                <Link href="/dashboard" onClick={closeMobileMenu}>
                  <Button className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#f97316] text-white">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link href="/login" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-100 text-slate-800">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={closeMobileMenu}>
                    <Button className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#f97316] text-white">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
