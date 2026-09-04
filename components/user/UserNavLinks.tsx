"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { userNavLinks, isSubmenuItem } from "./UserSidebar";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface UserNavLinksProps {
  /** Vertical layout for mobile drawer (stacked, full-width links) */
  vertical?: boolean;
  /** Optional: close mobile menu after navigation (call in onClick) */
  onLinkClick?: () => void;
}

export default function UserNavLinks({ vertical, onLinkClick }: UserNavLinksProps) {
  const pathname = usePathname();
  const isSettingsActive = pathname === "/user/profile" || pathname === "/contact";
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  return (
    <div className={vertical ? "flex flex-col gap-1.5" : "flex items-center gap-2 sm:gap-3"}>
      {userNavLinks.map((item) => {
        if (isSubmenuItem(item)) {
          const hasActiveChild = item.children.some(
            (c) => c.href === pathname || pathname.startsWith(c.href + "/")
          );

          return (
            <div key={item.label} className="flex flex-col">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                  hasActiveChild
                    ? "bg-slate-100 text-slate-900 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon
                    className={`h-4.5 w-4.5 shrink-0 ${hasActiveChild ? "text-blue-600" : "opacity-60"}`}
                  />
                  <span className="text-[13px]">{item.label}</span>
                </div>
                <span className="text-slate-400">
                  {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </span>
              </button>

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
                        onClick={onLinkClick}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
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
              onClick={onLinkClick}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-all border border-amber-300/80 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-orange-50/80 text-amber-900 hover:from-amber-100 hover:to-orange-100 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <item.icon className="h-4.5 w-4.5 shrink-0 text-amber-600 self-start mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold leading-tight">Get Super Resume</span>
                  <span className="text-[10px] font-semibold text-amber-700 leading-tight">Talk to Expert</span>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-amber-600 shrink-0" />
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
            onClick={onLinkClick}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-all ${
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon
                className={`h-4.5 w-4.5 shrink-0 ${isActive ? "scale-105" : "opacity-60"}`}
                style={isActive ? { color: "white" } : {}}
              />
              <span className="text-[13px] font-semibold">
                {isActive ? <span style={{ color: "white" }}>{item.label}</span> : item.label}
              </span>
            </div>
            {item.badge && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
