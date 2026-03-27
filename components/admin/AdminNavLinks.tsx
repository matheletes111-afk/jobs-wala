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
} from "lucide-react";

export const adminNavLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/resume-database", label: "Resume DB", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
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
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
