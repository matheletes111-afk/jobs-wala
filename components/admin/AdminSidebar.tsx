"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderTree,
  BarChart3,
  FileText,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/resume-database", label: "Resume DB", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/plans", label: "Plans", icon: BarChart3 },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/career-packages", label: "Career Svcs", icon: GraduationCap },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

export default function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: "/login",
        redirect: false 
      });
      window.location.href = "/login";
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <aside
      className={`border-r border-slate-200 bg-white h-screen fixed left-0 top-0 bottom-0 flex flex-col justify-between transition-all duration-300 z-40 ${
        isCollapsed ? "w-20 p-4" : "w-72 p-6"
      } hidden md:flex`}
    >
      {/* Upper part */}
      <div className="flex flex-col gap-8">
        {/* Header & Toggle */}
        <div className={`flex items-center justify-between gap-3 min-w-0 ${isCollapsed ? "flex-col gap-2" : "flex-row"}`}>
          {!isCollapsed ? (
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-start shrink-0 h-12 overflow-hidden">
                <img
                  src="/images/logo.png"
                  alt="JobDaddy Logo"
                  className="h-[200%] w-auto max-w-none object-contain"
                />
              </div>
            </Link>
          ) : (
            <div className="h-12 w-12 flex items-center justify-center shrink-0">
              <img
                src="/images/favicon.png"
                alt="JobDaddy"
                className="h-8 w-8 object-contain"
              />
            </div>
          )}

          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className={`h-9 w-9 text-slate-650 hover:bg-slate-50 hover:text-slate-900 rounded-xl shrink-0 ${
                isCollapsed ? "mt-1" : ""
              }`}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === pathname ||
              (href !== "/admin/dashboard" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex w-full items-center gap-3.5 rounded-xl transition-all duration-300 ${
                  isCollapsed ? "justify-center p-3" : "px-4 py-3"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                    isActive ? "scale-105" : "opacity-60"
                  }`}
                  style={isActive ? { color: "white" } : {}}
                />
                {!isCollapsed && (
                  <span className="truncate">
                    {isActive ? <span style={{ color: "white" }}>{label}</span> : label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Lower part (Sign Out) */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
        <button
          onClick={handleSignOut}
          title={isCollapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-750 transition-colors font-semibold ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0 text-red-500" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
