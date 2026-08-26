"use client";

import { useState } from "react";
import EmployerSidebar from "./EmployerSidebar";
import EmployerHeaderNav from "./EmployerHeaderNav";
import Link from "next/link";

interface EmployerLayoutClientProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  isApproved: boolean;
  dbUserApprovalStatus?: string;
  dbUserRejectionReason?: string | null;
  userEmail?: string;
  companyLogo?: string | null;
  companyName?: string;
}

export default function EmployerLayoutClient({
  children,
  footer,
  isApproved,
  dbUserApprovalStatus,
  dbUserRejectionReason,
  userEmail,
  companyLogo,
  companyName,
}: EmployerLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-transparent text-foreground selection:bg-primary/30 flex-row relative">
      {/* Left Sidebar for desktop */}
      <EmployerSidebar
        isApproved={isApproved}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-72"
        }`}
      >
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
          <div className="mx-auto flex h-20 w-full max-w-7xl min-w-0 items-center justify-between gap-4 px-4 sm:px-6 md:px-8 lg:px-10">
            {/* Desktop Employer Panel Label */}
            <div className="hidden md:flex items-center">
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-500 shrink-0">
                Employer Panel
              </span>
            </div>

            {/* Mobile logo only */}
            <div className="flex items-center md:hidden pl-0">
              <Link href="/" className="flex shrink-0 items-center gap-3">
                <div className="flex items-center justify-start shrink-0 h-10 overflow-hidden">
                  <img
                    src="/images/logo.png"
                    alt="Jobs Portal"
                    className="h-[200%] w-auto max-w-none object-contain"
                  />
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-4 ml-auto">
              <EmployerHeaderNav
                isApproved={isApproved}
                userEmail={userEmail}
                companyLogo={companyLogo}
                companyName={companyName}
              />
            </nav>
          </div>
        </header>

        <main className="min-w-0 flex-1 relative flex flex-col justify-between">
          <div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            {!isApproved && (
              <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 md:px-8 lg:px-10">
                <div
                  className={`rounded-[1.5rem] border p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-700 ${
                    dbUserApprovalStatus === "REJECTED"
                      ? "border-red-500/20 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent"
                      : "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border ${
                        dbUserApprovalStatus === "REJECTED"
                          ? "bg-red-500/20 border-red-500/20"
                          : "bg-amber-500/20 border-amber-500/20"
                      }`}
                    >
                      <svg
                        className={`h-6 w-6 animate-pulse ${
                          dbUserApprovalStatus === "REJECTED" ? "text-red-500" : "text-amber-500"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white tracking-tight">
                        {dbUserApprovalStatus === "REJECTED"
                          ? "Profile Rejected by Admin"
                          : "Profile Completion Required"}
                      </h3>
                      <p className="mt-0.5 text-xs font-semibold text-white/60">
                        {dbUserApprovalStatus === "REJECTED"
                          ? `Reason: ${dbUserRejectionReason || "No reason provided."}. Please correct the details below and submit again.`
                          : "Your profile is pending administrator approval. Please make sure all profile fields are completed."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {children}
          </div>

          {/* Render Footer here, inside the padded layout area! */}
          {footer && <div className="mt-auto">{footer}</div>}
        </main>
      </div>
    </div>
  );
}
