"use client";

import { useState } from "react";
import Link from "next/link";
import AdminSidebar from "./AdminSidebar";
import AdminHeaderNav from "./AdminHeaderNav";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  footer: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export default function AdminLayoutClient({
  children,
  footer,
  userEmail,
  userName,
}: AdminLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full min-w-0 bg-transparent text-foreground selection:bg-primary/30 flex-row relative animate-in fade-in duration-1000">
      {/* Left Sidebar for desktop */}
      <AdminSidebar
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
            {/* Desktop Admin Panel Label */}
            <div className="hidden md:flex items-center">
              <span className="rounded-full bg-blue-600/10 border border-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-600 shrink-0">
                Admin Control Room
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
              <AdminHeaderNav
                userEmail={userEmail}
                userName={userName}
              />
            </nav>
          </div>
        </header>

        <main className="min-w-0 flex-1 relative flex flex-col justify-between">
          <div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
            {children}
          </div>

          <div className="mt-auto">{footer}</div>
        </main>
      </div>
    </div>
  );
}
