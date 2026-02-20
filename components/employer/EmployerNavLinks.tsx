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

const navLinks = [
  { href: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", label: "My Jobs", icon: Briefcase },
  { href: "/employer/applications", label: "Applications", icon: FileText },
  { href: "/employer/search", label: "Search Candidates", icon: Search },
  { href: "/employer/profile", label: "Profile", icon: User },
];

export default function EmployerNavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === pathname ||
          (href !== "/employer/dashboard" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
