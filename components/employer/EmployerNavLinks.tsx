"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Search,
  User,
} from "lucide-react";

export const employerNavLinks = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/employer/applications", label: "Applications", icon: FileText },
  { href: "/employer/search", label: "Search Candidates", icon: Search },
  { href: "/employer/profile", label: "Profile", icon: User },
];

interface EmployerNavLinksProps {
  /** Vertical layout for mobile drawer (stacked, full-width links) */
  vertical?: boolean;
  /** Optional: close mobile menu after navigation (call in onClick) */
  onLinkClick?: () => void;
  canAccessResumeSearch: boolean;
}

export default function EmployerNavLinks({
  vertical,
  onLinkClick,
  canAccessResumeSearch,
}: EmployerNavLinksProps) {
  const pathname = usePathname();
  const links = canAccessResumeSearch
    ? [
        ...employerNavLinks,
        {
          href: "/employer/resume-search",
          label: "Resume Search",
          icon: Search,
        },
      ]
    : employerNavLinks;

  const linkClass = vertical
    ? (isActive: boolean) =>
        `flex w-full items-center gap-4 rounded-xl px-5 py-4 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        }`
    : (isActive: boolean) =>
        `flex items-center gap-2 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
          isActive
            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        }`;

  const wrapperClass = vertical
    ? "flex flex-col gap-2"
    : "flex items-center gap-1";

  return (
    <div className={wrapperClass}>
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === pathname ||
          (href !== "/employer/dashboard" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={linkClass(isActive)}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 opacity-60"}`} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
