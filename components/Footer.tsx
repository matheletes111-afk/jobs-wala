import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { CategoryStatus } from "@prisma/client";
import { formatLocation } from "@/lib/utils";
import {
  MapPin,
  Mail,
  Phone,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";

export default async function Footer() {
  const user = await getCurrentUser();

  // Latest 8 active categories (by createdAt desc)
  const categoriesRaw = await prisma.category.findMany({
    where: { status: CategoryStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, name: true },
  });

  return (
    <footer className="bg-[#e0f2fe]/80 border-t border-[#bae6fd] text-slate-700 mt-auto">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Logo & Description Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/images/logo.jpeg"
                alt="Jobdaddy"
                className="h-8 md:h-9 object-contain rounded-lg border border-[#bae6fd] bg-white p-1"
              />
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Jobdaddy</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed max-w-xs mb-6">
              AI-powered job portal that connects talent with the right opportunities.
            </p>
          </div>

          {/* Column 1: JOBS BY CATEGORY */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-blue-700">JOBS BY CATEGORY</h3>
            <ul className="space-y-3 text-xs font-semibold text-slate-600">
              {categoriesRaw.length > 0 ? (
                categoriesRaw.slice(0, 8).map((cat) => (
                  <li key={cat.id}>
                    <Link href={`/jobs/category/${encodeURIComponent(cat.name)}`} className="hover:text-blue-600 transition-colors block truncate">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                ["Human Resources", "Artificial Intelligence", "Engineering", "Manufacturing", "Defence", "Healthcare"].map((mockCat) => (
                  <li key={mockCat}>
                    <Link href="/user/jobs" className="hover:text-blue-600 transition-colors block">
                      {mockCat}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Column 3: CONTACT US */}
          <div>
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-blue-700">CONTACT US</h3>
            <div className="space-y-4 text-xs font-semibold text-slate-600 mb-6">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>Sector 12, Greater Noida (U.P)</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-blue-600" />
                <a href="mailto:Info@jobdaddy.in" className="hover:text-blue-600 transition-colors">
                  Info@jobdaddy.in
                </a>
              </p>
            </div>
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Youtube, label: "YouTube" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 hover:bg-sky-200 text-blue-600 transition-colors"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#bae6fd] bg-[#bae6fd]/30 py-6 text-xs font-bold text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Jobdaddy.co.in | All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <span className="text-rose-500 text-sm">❤️</span> in India
          </p>
        </div>
      </div>
    </footer>
  );
}
