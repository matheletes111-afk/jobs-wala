"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderTree,
  BarChart3,
  FileText,
  GraduationCap,
} from "lucide-react";

export const adminNavLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/resume-database", label: "Resume DB", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/plans", label: "Plans", icon: BarChart3 },
  { href: "/admin/career-packages", label: "Career Svcs", icon: GraduationCap },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

interface AdminNavLinksProps {
  /** Vertical layout for mobile drawer (stacked, full-width links) */
  vertical?: boolean;
  /** Optional: close mobile menu after navigation (call in onClick) */
  onLinkClick?: () => void;
}

export default function AdminNavLinks({ vertical, onLinkClick }: AdminNavLinksProps) {
  const pathname = usePathname();

  const linkClass = vertical
    ? (isActive: boolean) =>
      `flex w-full items-center gap-4 rounded-xl px-4 py-4 text-sm font-semibold transition-all duration-300 ${isActive
        ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]"
        : "text-slate-800 hover:bg-slate-100"
      }`
    : (isActive: boolean) =>
      `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${isActive
        ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg shadow-orange-500/20 scale-[1.05]"
        : "text-slate-800 hover:bg-slate-100"
      }`;

  const wrapperClass = vertical
    ? "flex flex-col gap-2"
    : "flex items-center gap-2 sm:gap-4";

  return (
    <div className={wrapperClass}>
      {adminNavLinks.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === pathname ||
          (href !== "/admin/dashboard" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={linkClass(isActive)}
          >
            <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "scale-110" : "opacity-60"}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
