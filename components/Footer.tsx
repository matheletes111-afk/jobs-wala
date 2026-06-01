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
    <footer className="mt-auto border-t border-black/10">
      {/* Main footer - Blue */}
      <div className="bg-sky-200 text-black">
        <div className="container mx-auto px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Quick Links */}
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-primary">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="#about"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   About us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#services"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="#products"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/user/jobs"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contact"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                   Contact us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#book-demo"
                    className="text-sm text-black/80 transition-colors hover:text-black font-semibold text-primary"
                  >
                   Book Demo
                  </Link>
                </li>
                <li>
                  <Link
                    href="#free-trial"
                    className="text-sm text-black/80 transition-colors hover:text-black font-semibold text-emerald-600"
                  >
                   Free trial
                  </Link>
                </li>
                <li className="pt-2 border-t border-black/5">
                  <Link
                    href="/employer/jobs/new"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                    Post Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/user/jobs"
                    className="text-sm text-black/80 transition-colors hover:text-black"
                  >
                    Search Jobs
                  </Link>
                </li>
                {user ? (
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-sm text-black/80 transition-colors hover:text-black"
                    >
                      Dashboard
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link
                        href="/login"
                        className="text-sm text-black/80 transition-colors hover:text-black"
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/register"
                        className="text-sm text-black/80 transition-colors hover:text-black"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Jobs By Category */}
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-primary">Jobs By Category</h3>
              <ul className="space-y-3">
                {categoriesRaw.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/jobs/category/${encodeURIComponent(cat.name)}`}
                      className="text-sm text-black/80 transition-colors hover:text-black"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {categoriesRaw.length === 0 && (
                  <li className="text-sm text-black/60">No categories yet</li>
                )}
              </ul>
            </div>

            {/* Top Company Latest */}
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-primary">Top Company Latest</h3>
              <ul className="space-y-4">
                {topCompanies.map((c) => (
                  <li key={c.userId}>
                    <Link
                      href={`/jobs/company/${c.userId}`}
                      className="group flex items-center gap-3 text-sm text-black/80 transition-all hover:text-black hover:translate-x-1"
                    >
                      <CompanyLogo
                        companyLogo={c.companyLogo}
                        companyName={c.companyName}
                        className="h-8 w-8 shrink-0 rounded-lg border border-black/10 bg-white/50 transition-all group-hover:border-black/20"
                      />
                      <span className="font-medium">{c.companyName}</span>
                    </Link>
                  </li>
                ))}
                {topCompanies.length === 0 && (
                  <li className="text-sm text-black/60">No companies yet</li>
                )}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-primary">Contact Us</h3>
              <div className="space-y-4 text-sm text-black/80">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Sector 12, Greater Noida (U.P)
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href="mailto:Info@jobdaddy.in"
                    className="transition-colors hover:text-black"
                  >
                    Info@jobdaddy.in
                  </a>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <a
                    href="tel:+91-8800614884"
                    className="transition-colors hover:text-black"
                  >
                    +91-8800614884
                  </a>
                </p>
              </div>
              <div className="mt-8 flex items-center gap-3">
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
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black/80 transition-all hover:bg-black/10 hover:text-black hover:-translate-y-1"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-black/10 bg-sky-300/50 py-6">
        <div className="container mx-auto px-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-black">
          Copyright © 2026 Jobs Daddy. All rights reserved. Design by: SRV
          Technology
        </div>
      </div>
    </footer>
  );
}
