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

  // Top companies (latest: employers with active jobs, ordered by latest job)
  const recentJobs = await prisma.job.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { postedBy: true },
    take: 32,
  });
  const uniqueEmployerIds = Array.from(
    new Map(recentJobs.map((j) => [j.postedBy, true])).keys()
  ).slice(0, 8);

  const [employerProfiles, jobsForLocation] = await Promise.all([
    prisma.employerProfile.findMany({
      where: { userId: { in: uniqueEmployerIds } },
      select: { userId: true, companyName: true, companyLogo: true },
    }),
    prisma.job.findMany({
      where: { postedBy: { in: uniqueEmployerIds }, status: "ACTIVE" },
      select: { postedBy: true, location: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const locationByEmployer: Record<string, string> = {};
  for (const j of jobsForLocation) {
    if (locationByEmployer[j.postedBy] == null)
      locationByEmployer[j.postedBy] = formatLocation(j.location);
  }

  const topCompanies = uniqueEmployerIds
    .map((uid) => {
      const profile = employerProfiles.find((e) => e.userId === uid);
      if (!profile) return null;
      return {
        userId: profile.userId,
        companyName: profile.companyName,
        companyLogo: profile.companyLogo ?? null,
        location: locationByEmployer[uid] ?? "—",
      };
    })
    .filter(Boolean) as {
    userId: string;
    companyName: string;
    companyLogo: string | null;
    location: string;
  }[];

  return (
    <footer className="mt-auto">
      {/* Main footer - dark grayish blue */}
      <div className="bg-[#1e293b] text-white">
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-base font-semibold">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/employer/jobs/new"
                    className="text-sm text-white/90 transition hover:text-white hover:underline"
                  >
                    Post Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/user/jobs"
                    className="text-sm text-white/90 transition hover:text-white hover:underline"
                  >
                    Search Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="text-sm text-white/90 transition hover:text-white hover:underline"
                  >
                   Home
                  </Link>
                </li>
                {user ? (
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm text-white/90 transition hover:text-white hover:underline"
                    >
                      Dashboard
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/login"
                        className="text-sm text-white/90 transition hover:text-white hover:underline"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/register"
                        className="text-sm text-white/90 transition hover:text-white hover:underline"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Jobs By Category - latest 8 */}
            <div>
              <h3 className="mb-4 text-base font-semibold">Jobs By Category</h3>
              <ul className="space-y-2">
                {categoriesRaw.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/jobs/category/${encodeURIComponent(cat.name)}`}
                      className="text-sm text-white/90 transition hover:text-white hover:underline"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {categoriesRaw.length === 0 && (
                  <li className="text-sm text-white/70">No categories yet</li>
                )}
              </ul>
            </div>

            {/* Top Company Latest */}
            <div>
              <h3 className="mb-4 text-base font-semibold">Top Company Latest</h3>
              <ul className="space-y-2">
                {topCompanies.map((c) => (
                  <li key={c.userId}>
                    <Link
                      href={`/jobs/company/${c.userId}`}
                      className="flex items-center gap-2 text-sm text-white/90 transition hover:text-white hover:underline"
                    >
                      <CompanyLogo
                        companyLogo={c.companyLogo}
                        companyName={c.companyName}
                        className="h-6 w-6 shrink-0"
                      />
                      <span>{c.companyName}</span>
                    </Link>
                  </li>
                ))}
                {topCompanies.length === 0 && (
                  <li className="text-sm text-white/70">No companies yet</li>
                )}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="mb-4 text-base font-semibold">Contact Us</h3>
              <div className="space-y-3 text-sm text-white/90">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    651 N Broad St, Suite 201, Middletown, Zip Code 19709, New
                    Castle, Delaware, USA
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a
                    href="mailto:info@jobsdaddy.com"
                    className="hover:text-white hover:underline"
                  >
                    info@jobsdaddy.com
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a
                    href="tel:+13025550123"
                    className="hover:text-white hover:underline"
                  >
                    +1 (302) 555-0123
                  </a>
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#334155] text-white transition hover:bg-[#475569]"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#334155] text-white transition hover:bg-[#475569]"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#334155] text-white transition hover:bg-[#475569]"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#334155] text-white transition hover:bg-[#475569]"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#334155] text-white transition hover:bg-[#475569]"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* White copyright bar */}
      <div className="border-t border-gray-200 bg-white py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          Copyright © 2026 Jobs Daddy. All rights reserved. Design by: SRV
          Technology
        </div>
      </div>
    </footer>
  );
}
