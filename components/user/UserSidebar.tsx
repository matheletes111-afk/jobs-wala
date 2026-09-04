"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FileUp,
  Settings,
  UserCog,
  Headphones,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export type RegularNavItem = {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  isExternal?: boolean;
};

export type SubmenuNavItem = {
  label: string;
  icon: any;
  isSubmenu: true;
  children: { href: string; label: string; icon: any }[];
};

export type NavItem = RegularNavItem | SubmenuNavItem;

export function isSubmenuItem(item: NavItem): item is SubmenuNavItem {
  return "isSubmenu" in item && item.isSubmenu === true;
}

export const userNavLinks: NavItem[] = [
  { href: "/user/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/user/jobs", label: "Browse Jobs", icon: Briefcase },
  { href: "/user/applications", label: "My Applications", icon: FileText },
  { href: "/user/profile#resume", label: "Update Resume", icon: FileUp },
  {
    label: "Settings",
    icon: Settings,
    isSubmenu: true,
    children: [
      { href: "/user/profile", label: "Profile Settings", icon: UserCog },
      { href: "/contact", label: "Contact Us", icon: Headphones },
    ],
  },
  { href: "/user/learning", label: "My Learning Hub", icon: GraduationCap, badge: "Soon" },
  {
    href: "https://forms.gle/N3RjJVVzBC5xQ6eY9",
    label: "Get Super Resume / Talk to Expert",
    icon: Sparkles,
    isExternal: true,
  },
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
  const isSettingsActive = pathname === "/user/profile" || pathname === "/contact";
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  return (
    <aside
      className={`border-r border-slate-200 bg-white h-screen fixed left-0 top-0 bottom-0 flex flex-col transition-all duration-300 z-40 ${
        isCollapsed ? "w-20 p-3" : "w-72 lg:w-[285px] p-4 sm:p-5"
      } hidden md:flex`}
    >
      {/* Header & Toggle (Fixed Top) */}
      <div className={`shrink-0 pb-3 border-b border-slate-100 flex items-center justify-between gap-3 min-w-0 ${isCollapsed ? "flex-col gap-2" : "flex-row"}`}>
        {!isCollapsed ? (
          <Link href="/" className="flex items-center justify-center flex-1 min-w-0">
            <div className="flex items-center justify-center shrink-0 h-12 overflow-hidden">
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
            className={`h-8.5 w-8.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl shrink-0 ${
              isCollapsed ? "mt-1" : ""
            }`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
          </Button>
        )}
      </div>

      {/* Middle Scrollable Navigation Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar py-3 pr-0.5">
        <nav className="flex flex-col gap-1.5">
          {userNavLinks.map((item) => {
            if (isSubmenuItem(item)) {
              const hasActiveChild = item.children.some(
                (c) => c.href === pathname || pathname.startsWith(c.href + "/")
              );

              if (isCollapsed) {
                return (
                  <Link
                    key={item.label}
                    href="/user/profile"
                    title="Settings (Profile & Contact)"
                    className={`flex w-full items-center justify-center p-2.5 rounded-xl transition-all duration-200 ${
                      hasActiveChild
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                    }`}
                  >
                    <item.icon
                      className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                        hasActiveChild ? "" : "opacity-60"
                      }`}
                      style={hasActiveChild ? { color: "white" } : {}}
                    />
                  </Link>
                );
              }

              return (
                <div key={item.label} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      hasActiveChild
                        ? "bg-slate-100 text-slate-900 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon
                        className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                          hasActiveChild ? "text-blue-600" : "opacity-60"
                        }`}
                      />
                      <span className="text-[13px] font-semibold truncate">{item.label}</span>
                    </div>
                    <span className="text-slate-400">
                      {settingsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  {/* Sub-menu items */}
                  {settingsOpen && (
                    <div className="ml-4 pl-3 border-l-2 border-slate-200 flex flex-col gap-1 mt-1 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.children.map((sub) => {
                        const isSubActive =
                          sub.href === pathname ||
                          (sub.href !== "/user/dashboard" && pathname.startsWith(sub.href + "/"));
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-200 ${
                              isSubActive
                                ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80"
                                : "text-slate-800 hover:text-blue-600 hover:bg-slate-100 font-bold"
                            }`}
                          >
                            <sub.icon
                              className={`h-4 w-4 shrink-0 transition-colors ${
                                isSubActive ? "text-blue-600" : "text-slate-700"
                              }`}
                            />
                            <span className={isSubActive ? "text-blue-700 font-bold" : "text-slate-800 font-bold"}>
                              {sub.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (item.isExternal) {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isCollapsed ? item.label : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-xl transition-all duration-200 group border border-amber-300/80 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-orange-50/80 hover:from-amber-100 hover:to-orange-100 shadow-sm ${
                    isCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0 text-amber-600 group-hover:scale-110 transition-transform mt-0.5 self-start" />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0 gap-1.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-amber-900 leading-tight">
                          Get Super Resume
                        </span>
                        <span className="text-[10px] font-semibold text-amber-700 leading-tight">
                          Talk to Expert
                        </span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-amber-600 shrink-0 opacity-80 group-hover:opacity-100" />
                    </div>
                  )}
                </a>
              );
            }

            const isActive =
              item.href === pathname ||
              (item.href !== "/user/dashboard" && !item.href.includes("#") && pathname.startsWith(item.href + "/"));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl transition-all duration-200 ${
                  isCollapsed ? "justify-center p-2.5" : "px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                }`}
              >
                <item.icon
                  className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                    isActive ? "scale-105" : "opacity-60"
                  }`}
                  style={isActive ? { color: "white" } : {}}
                />
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1 min-w-0 gap-1.5">
                    <span className="text-[13px] font-semibold truncate">
                      {isActive ? <span style={{ color: "white" }}>{item.label}</span> : item.label}
                    </span>
                    {item.badge && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom part (Fixed Bottom) */}
      <div className="shrink-0 border-t border-slate-100 pt-3 mt-auto flex flex-col gap-2.5">
        {!isCollapsed && (
          <div className="flex items-center px-2">
            <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-600">
              Candidate Panel
            </span>
          </div>
        )}
        <div className="w-full px-1">
          <LogoutButton
            showText={!isCollapsed}
            className={`flex w-full items-center transition-all duration-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl ${
              isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5 gap-2.5 text-xs font-bold justify-start"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
