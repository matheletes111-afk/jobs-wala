"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const userNavLinks = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/user/applications", label: "My Applications", icon: FileText },
  { href: "/user/profile", label: "Profile", icon: User },
];

interface UserSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function UserSidebar({
  isCollapsed = false,
  onToggleCollapse,
}: UserSidebarProps) {
  const pathname = usePathname();

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
              className={`h-9 w-9 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl shrink-0 ${
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
          {userNavLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === pathname ||
              (href !== "/user/dashboard" && pathname.startsWith(href + "/"));
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
              Candidate Panel
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
