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
        `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            : "text-gray-700 hover:bg-gray-100"
        }`
    : (isActive: boolean) =>
        `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`;

  const wrapperClass = vertical
    ? "flex flex-col gap-1"
    : "flex items-center gap-2 sm:gap-3";

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
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
