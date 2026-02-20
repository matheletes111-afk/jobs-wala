"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List, ChevronDown, Briefcase, User } from "lucide-react";
import { formatLocation } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  jobSeekerProfile: {
    firstName: string;
    lastName: string;
    location?: string | null;
    skills?: string[];
    experience?: number | null;
    jobTitle?: string | null;
    availabilityStatus?: string | null;
    bio?: string | null;
  } | null;
  employerProfile: {
    companyName: string;
    companyLogo?: string | null;
    industry?: string | null;
    companySize?: string | null;
    description?: string | null;
  } | null;
}

interface FetchResult {
  users: UserItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

function displayLocation(loc: string | null | undefined): string {
  if (!loc) return "—";
  try {
    return formatLocation(loc);
  } catch {
    return loc;
  }
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedRole, setAppliedRole] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sort, setSort] = useState("recent");

  const limit = 12;

  const fetchUsers = useCallback(
    async (pageNum: number, searchVal: string, roleVal: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (roleVal && roleVal !== "all") params.set("role", roleVal);
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? 1);
      } catch {
        setUsers([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers(page, appliedSearch, appliedRole);
  }, [page, appliedSearch, appliedRole, fetchUsers]);

  const handleSearch = () => {
    setAppliedSearch(search);
    setAppliedRole(role);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setRole("all");
    setAppliedSearch("");
    setAppliedRole("all");
    setPage(1);
  };

  const sortedUsers =
    sort === "oldest"
      ? [...users].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      : users;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const containerClass =
    "container mx-auto px-4 py-8 md:px-6 lg:px-8 lg:py-10";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className={containerClass}>
        {/* Hero / Search Section */}
        <div className="rounded-b-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 px-6 pb-8 pt-6 md:px-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb]">
          Manage Users & Profiles
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
          Curate users with confidence
        </h1>
        <p className="mb-6 text-gray-600">
          Filter by role, search by name or email to surface candidates and employers.
        </p>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="relative flex-1 min-w-[180px]">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Name, email or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <div className="w-[180px]">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
                <SelectItem value="EMPLOYER">Employer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#2563eb] hover:bg-[#1d4ed8]"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
        </div>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        {/* Left Filter Panel */}
        <aside className="w-full shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:w-72">
          <h2 className="mb-4 font-semibold text-gray-900">Search users</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Name or email
              </label>
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
                  <SelectItem value="EMPLOYER">Employer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
            >
              Apply filters
            </Button>
          </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{total} Users Found</span>
              <span className="ml-2 text-sm">
                Showing {start} - {end} {total > 0 ? "users" : ""}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-2 ${viewMode === "grid" ? "bg-[#2563eb] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-2 ${viewMode === "list" ? "bg-[#2563eb] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  aria-label="List view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500 shadow-sm">
              No users match your filters. Try adjusting search or clear filters.
            </div>
          ) : (
            <div
              className={`grid gap-6 ${viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"}`}
            >
              {sortedUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: UserItem }) {
  const isEmployer = user.role === "EMPLOYER";
  const isJobSeeker = user.role === "JOB_SEEKER";

  const displayName = isJobSeeker && user.jobSeekerProfile
    ? `${user.jobSeekerProfile.firstName} ${user.jobSeekerProfile.lastName}`
    : isEmployer && user.employerProfile
      ? user.employerProfile.companyName
      : user.email;

  const subtitle = isJobSeeker && user.jobSeekerProfile
    ? [
        user.jobSeekerProfile.jobTitle,
        user.jobSeekerProfile.experience != null && `${user.jobSeekerProfile.experience} yrs exp`,
        user.jobSeekerProfile.location ? displayLocation(user.jobSeekerProfile.location) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : isEmployer && user.employerProfile
      ? [
          user.employerProfile.industry,
          user.employerProfile.companySize,
        ]
        .filter(Boolean)
        .join(" · ")
      : user.email;

  const bio = isJobSeeker && user.jobSeekerProfile?.bio
    ? user.jobSeekerProfile.bio.slice(0, 120) + (user.jobSeekerProfile.bio.length > 120 ? "…" : "")
    : isEmployer && user.employerProfile?.description
      ? user.employerProfile.description.slice(0, 120) + (user.employerProfile.description.length > 120 ? "…" : "")
      : null;

  const skills = isJobSeeker && user.jobSeekerProfile?.skills?.length
    ? user.jobSeekerProfile.skills.slice(0, 5)
    : isEmployer && user.employerProfile?.industry
      ? [user.employerProfile.industry]
      : [];

  const logoUrl = isEmployer && user.employerProfile?.companyLogo
    ? user.employerProfile.companyLogo
    : null;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0">
          {logoUrl ? (
            <AvatarImage src={logoUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="bg-[#2563eb]/10 text-[#2563eb] text-lg font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
            <span className="mb-1 inline-block rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {user.jobSeekerProfile.availabilityStatus}
            </span>
          )}
          <h3 className="font-semibold text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-500">{subtitle || user.email}</p>
        </div>
      </div>
      {bio && (
        <p className="mt-3 line-clamp-3 text-sm text-gray-600">{bio}</p>
      )}
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#2563eb]"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="flex items-center gap-1 text-sm text-gray-500">
          <Briefcase className="h-4 w-4" />
          {user.role.replace("_", " ")}
        </span>
        <Link href={`/admin/users/${user.id}`}>
          <Button variant="outline" size="sm" className="border-[#2563eb] text-[#2563eb] hover:bg-blue-50">
            View profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
