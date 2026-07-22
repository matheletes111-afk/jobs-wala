"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Search,
  UserCheck,
  Zap,
  User,
  Plus,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const employerNavLinks = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/employer/applications", label: "Applications", icon: FileText },
  { href: "/employer/search", label: "Search Candidates", icon: Search },
  { href: "/employer/resume-search", label: "Resume Search", icon: UserCheck },
  { href: "/employer/xray-search", label: "X-Ray Search", icon: Search },
  { href: "/employer/subscription", label: "Subscription", icon: Zap },
  { href: "/employer/profile", label: "Profile", icon: User },
];

interface EmployerSidebarProps {
  isApproved?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function EmployerSidebar({
  isApproved = true,
  isCollapsed = false,
  onToggleCollapse,
}: EmployerSidebarProps) {
  const pathname = usePathname();
  const links = isApproved
    ? employerNavLinks
    : employerNavLinks.filter(link => link.href === "/employer/profile");

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
              {/* Collapsed small icon */}
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
              className={`h-9 w-9 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl shrink-0 ${
                isCollapsed ? "mt-1" : ""
              }`}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Post a Job CTA */}
        {isApproved && (
          <Link href="/employer/jobs/new">
            {isCollapsed ? (
              <Button
                size="icon"
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto"
                title="Post a Job"
              >
                <Plus className="h-5 w-5" style={{ color: "white" }} />
              </Button>
            ) : (
              <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" style={{ color: "white" }} />
                <span style={{ color: "white" }}>Post a Job</span>
              </Button>
            )}
          </Link>
        )}

        {/* Navigation links */}
        <nav className="flex flex-col gap-1.5">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === pathname ||
              (href !== "/employer/dashboard" && pathname.startsWith(href + "/"));
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

      {/* Bottom part */}
      <div className="border-t border-slate-100 pt-5 flex flex-col gap-3.5">
        {!isCollapsed && (
          <div className="flex items-center px-4">
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600">
              Employer Panel
            </span>
          </div>
        )}
        <div className="w-full px-2">
          <LogoutButton
            showText={!isCollapsed}
            className={`flex w-full items-center transition-all duration-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl ${
              isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3.5 text-sm font-semibold justify-start"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
