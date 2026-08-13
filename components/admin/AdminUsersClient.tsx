"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Search, LayoutGrid, List, ChevronDown, ChevronRight, Briefcase, User, Download } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatLocation, stripHtml } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";

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
    phone?: string | null;
    resumeUrl?: string | null;
    resumeUpdatedAt?: string | null;
    education?: string | null;
    certificates?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  employerProfile: {
    companyName: string;
    companyLogo?: string | null;
    industry?: string | null;
    companySize?: string | null;
    description?: string | null;
    resumeSearchEnabled?: boolean;
    resumeUploadEnabled?: boolean;
    website?: string | null;
    approvalStatus?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
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

export default function AdminUsersClient({
  searchParams: initialParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeRequestRef = useRef<AbortController | null>(null);

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
  const [updatingAccessFor, setUpdatingAccessFor] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const limit = 12;

  const updateUrl = useCallback(
    (pageNum: number, searchVal: string, roleVal: string) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (searchVal.trim()) params.set("search", searchVal.trim());
      if (roleVal && roleVal !== "all") params.set("role", roleVal);
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const getUserDetailUrl = (userId: string) => {
    const params = new URLSearchParams();
    params.set("from", pathname);
    if (page > 1) params.set("page", String(page));
    if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
    if (appliedRole && appliedRole !== "all") params.set("role", appliedRole);
    const query = params.toString();
    return `/admin/users/${userId}${query ? `?${query}` : ""}`;
  };

  const fetchUsers = useCallback(
    async (pageNum: number, searchVal: string, roleVal: string) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (searchVal.trim()) params.set("search", searchVal.trim());
        if (roleVal && roleVal !== "all") params.set("role", roleVal);
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data: FetchResult = await res.json();

        if (controller.signal.aborted) return;

        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 0);
        setPage(data.page ?? pageNum);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setUsers([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [limit]
  );

  const getParam = useCallback(
    (key: string): string | null => {
      const fromHook = searchParams.get(key);
      if (fromHook !== null) return fromHook;
      if (initialParams && typeof initialParams[key] === "string") {
        return initialParams[key] as string;
      }
      return null;
    },
    [searchParams, initialParams]
  );

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let searchVal = getParam("search");
    let roleVal = getParam("role");
    let pageValStr = getParam("page");

    const hasParams =
      searchVal !== null ||
      roleVal !== null ||
      pageValStr !== null;

    const storageKey = `admin_users_filters_${pathname}`;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          searchVal = parsed.search || "";
          roleVal = parsed.role || "all";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (searchVal?.trim()) params.set("search", searchVal.trim());
          if (roleVal && roleVal !== "all") params.set("role", roleVal);
          const query = params.toString();
          if (query) {
            router.replace(`${pathname}?${query}`, { scroll: false });
          }
        } catch (_e) {}
      }
    }

    const finalSearch = searchVal || "";
    const finalRole = roleVal || "all";
    const finalPage = parseInt(pageValStr || "1", 10);

    setSearch(finalSearch);
    setRole(finalRole);
    setPage(finalPage);

    setAppliedSearch(finalSearch);
    setAppliedRole(finalRole);

    const isClean =
      !finalSearch &&
      finalRole === "all" &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem(storageKey);
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              search: finalSearch,
              role: finalRole,
              appliedSearch: finalSearch,
              appliedRole: finalRole,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchUsers(finalPage, finalSearch, finalRole);
  }, [searchParams, pathname, router, fetchUsers, getParam]);

  const handleSearch = () => {
    const hasInputs = search.trim().length > 0 || (role && role !== "all");
    if (!hasInputs) {
      handleClear();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`admin_users_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(1, search, role);
    }
  };

  const handleClear = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`admin_users_filters_${pathname}`);
      } catch (_e) {}
    }

    setSearch("");
    setRole("all");
    setAppliedSearch("");
    setAppliedRole("all");
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchUsers(1, "", "all");
  };

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedSearch.trim()) params.set("search", appliedSearch.trim());
        if (appliedRole && appliedRole !== "all") params.set("role", appliedRole);
      }
      
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export");
      const data = await res.json();
      const exportUsers: UserItem[] = data.users ?? [];
      
      if (exportUsers.length === 0) {
        alert("No users found to export.");
        return;
      }
      
      const headers = [
        "ID", "Email", "Role", "Created At",
        "Name / Company Name", "Location", "Skills / Industry",
        "Experience / Company Size", "Job Title", "Availability", "Resume DB Access",
        "Phone", "Education", "Bio / Description", "Website", "Resume URL",
        "Resume Updated At", "Certificates", "Profile Created", "Profile Updated"
      ];

      const rows = exportUsers.map(user => {
        const isJS = user.role === "JOB_SEEKER";
        const isEmp = user.role === "EMPLOYER";

        const name = isJS && user.jobSeekerProfile ? `${user.jobSeekerProfile.firstName} ${user.jobSeekerProfile.lastName}` : isEmp && user.employerProfile ? user.employerProfile.companyName : "";
        const location = isJS && user.jobSeekerProfile?.location ? displayLocation(user.jobSeekerProfile.location) : "";
        const skillsIndustry = isJS && user.jobSeekerProfile ? (user.jobSeekerProfile.skills || []).join(", ") : isEmp && user.employerProfile ? user.employerProfile.industry || "" : "";
        const expSize = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.experience ?? "" : isEmp && user.employerProfile ? user.employerProfile.companySize || "" : "";
        const jobTitle = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.jobTitle || "" : "";
        const availability = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.availabilityStatus || "" : "";
        const resumeAccess = isEmp && user.employerProfile ? (user.employerProfile.resumeSearchEnabled ? "Yes" : "No") : "";
        const phone = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.phone || "" : "";
        const education = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.education || "" : "";
        const bioDesc = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.bio || "" : isEmp && user.employerProfile ? user.employerProfile.description || "" : "";
        const website = isEmp && user.employerProfile ? user.employerProfile.website || "" : "";
        const resumeUrl = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.resumeUrl || "" : "";
        const resumeUpdated = isJS && user.jobSeekerProfile?.resumeUpdatedAt ? new Date(user.jobSeekerProfile.resumeUpdatedAt).toISOString().split('T')[0] : "";
        const certs = isJS && user.jobSeekerProfile ? user.jobSeekerProfile.certificates || "" : "";
        
        const pCreated = isJS && user.jobSeekerProfile?.createdAt ? new Date(user.jobSeekerProfile.createdAt).toISOString().split('T')[0] : isEmp && user.employerProfile?.createdAt ? new Date(user.employerProfile.createdAt).toISOString().split('T')[0] : "";
        const pUpdated = isJS && user.jobSeekerProfile?.updatedAt ? new Date(user.jobSeekerProfile.updatedAt).toISOString().split('T')[0] : isEmp && user.employerProfile?.updatedAt ? new Date(user.employerProfile.updatedAt).toISOString().split('T')[0] : "";

        return [
          user.id,
          `"${user.email.replace(/"/g, '""')}"`,
          user.role,
          user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : "",
          `"${name.replace(/"/g, '""')}"`,
          `"${location.replace(/"/g, '""')}"`,
          `"${skillsIndustry.replace(/"/g, '""')}"`,
          `"${String(expSize).replace(/"/g, '""')}"`,
          `"${jobTitle.replace(/"/g, '""')}"`,
          `"${availability.replace(/"/g, '""')}"`,
          resumeAccess,
          `"${phone.replace(/"/g, '""')}"`,
          `"${education.replace(/"/g, '""')}"`,
          `"${bioDesc.replace(/"/g, '""')}"`,
          `"${website.replace(/"/g, '""')}"`,
          `"${resumeUrl.replace(/"/g, '""')}"`,
          resumeUpdated,
          `"${certs.replace(/"/g, '""')}"`,
          pCreated,
          pUpdated
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = applyFilters ? `users_filtered_${new Date().toISOString().split('T')[0]}.csv` : `users_all_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export users.");
      console.error(err);
    } finally {
      setExporting(false);
    }
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
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10";

  const toggleEmployerResumeAccess = async (userId: string, enabled: boolean) => {
    if (updatingAccessFor) return;
    setUpdatingAccessFor(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeSearchEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed to update access");
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId && item.employerProfile
            ? {
              ...item,
              employerProfile: {
                ...item.employerProfile,
                resumeSearchEnabled: enabled,
              },
            }
            : item
        )
      );
    } finally {
      setUpdatingAccessFor(null);
    }
  };

  const toggleEmployerResumeUpload = async (userId: string, enabled: boolean) => {
    if (updatingAccessFor) return;
    setUpdatingAccessFor(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUploadEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed to update upload permission");
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId && item.employerProfile
            ? {
              ...item,
              employerProfile: {
                ...item.employerProfile,
                resumeUploadEnabled: enabled,
              },
            }
            : item
        )
      );
    } finally {
      setUpdatingAccessFor(null);
    }
  };

  const updateEmployerApproval = async (userId: string, status: "APPROVED" | "REJECTED") => {
    if (updatingAccessFor) return;
    
    let reason: string | null = null;
    if (status === "REJECTED") {
      reason = prompt("Please enter the reason for rejecting this employer profile:");
      if (reason === null) return;
      if (!reason.trim()) {
        alert("A rejection reason is required.");
        return;
      }
    }

    setUpdatingAccessFor(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          approvalStatus: status,
          rejectionReason: reason || undefined
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setUsers((prev) =>
        prev.map((item) =>
          item.id === userId && item.employerProfile
            ? {
              ...item,
              employerProfile: {
                ...item.employerProfile,
                approvalStatus: status,
              },
            }
            : item
        )
      );
    } finally {
      setUpdatingAccessFor(null);
    }
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-foreground animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Registry Access Header */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1.5">User Management</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            User <span className="text-blue-600">Registry</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Manage system users, view profiles, and update access permissions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search name, email or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 pl-11 bg-transparent border-transparent focus-visible:ring-0 text-slate-700 placeholder:text-slate-400 font-semibold text-xs"
              />
            </div>
            <div className="w-[180px]">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
                  <SelectItem value="EMPLOYER">Employer</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSearch}
              loading={loading}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/10"
            >
              <span style={{ color: "white" }}>Search Users</span>
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              loading={loading}
              className="h-11 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Result Section */}
        <div className="space-y-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200/60 pb-6">
            <div className="flex flex-col gap-1">
              <p className="text-2xl font-bold text-slate-800 tracking-tight tabular-nums">
                {total} <span className="text-xs font-semibold text-blue-600 ml-2">Found</span>
              </p>
              <p className="text-xs font-semibold text-slate-400">
                Showing {start} - {end} users
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={() => handleExportCSV(true)}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export Filtered"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting}
                onClick={() => handleExportCSV(false)}
                className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export All"}
              </Button>
              <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-250/60">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-55"}`}
                  aria-label="Grid Scan"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-55"}`}
                  aria-label="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <div className="flex items-center gap-3 h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                  <span className="text-slate-400">SORT:</span> {sort === "recent" ? "LATEST" : "OLDEST"}
                  <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="recent">LATEST</option>
                  <option value="oldest">OLDEST</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center animate-pulse shadow-sm">
              <p className="text-xs font-semibold text-blue-500">Loading registry...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-24 text-center">
              <p className="text-xs font-semibold text-slate-400 italic">
                No matches found.
              </p>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${viewMode === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-2"}`}
            >
              {sortedUsers.map((user, idx) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onToggleResumeAccess={toggleEmployerResumeAccess}
                  onToggleResumeUpload={toggleEmployerResumeUpload}
                  onUpdateApproval={updateEmployerApproval}
                  isUpdating={updatingAccessFor === user.id}
                  index={idx}
                  getUserDetailUrl={getUserDetailUrl}
                />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => updateUrl(p, appliedSearch, appliedRole)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  onToggleResumeAccess,
  onToggleResumeUpload,
  onUpdateApproval,
  isUpdating,
  index,
  getUserDetailUrl,
}: {
  user: UserItem;
  onToggleResumeAccess: (userId: string, enabled: boolean) => Promise<void>;
  onToggleResumeUpload: (userId: string, enabled: boolean) => Promise<void>;
  onUpdateApproval: (userId: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  isUpdating: boolean;
  index: number;
  getUserDetailUrl: (userId: string) => string;
}) {
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
      user.jobSeekerProfile.experience != null && `${user.jobSeekerProfile.experience} YRS`,
      user.jobSeekerProfile.location ? displayLocation(user.jobSeekerProfile.location) : null,
    ]
      .filter(Boolean)
      .join(" // ")
    : isEmployer && user.employerProfile
      ? [
        user.employerProfile.industry,
        user.employerProfile.companySize,
      ]
        .filter(Boolean)
        .join(" // ")
      : user.email;

  const logoUrl = isEmployer && user.employerProfile?.companyLogo
    ? user.employerProfile.companyLogo
    : null;

  return (
    <div
      className="group bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
            {logoUrl ? (
              <AvatarImage src={logoUrl} alt={displayName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-blue-50 text-blue-600 text-lg font-bold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${isJobSeeker ? "bg-blue-500" : isEmployer ? "bg-indigo-500" : "bg-blue-500"}`} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.role.replace("_", " ")}</p>
            </div>
            <Link href={getUserDetailUrl(user.id)}>
              <h3 className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">{displayName}</h3>
            </Link>
            <p className="text-xs font-semibold text-slate-400 mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
          <span className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-650">
            {user.jobSeekerProfile.availabilityStatus}
          </span>
        )}

        {isEmployer && user.employerProfile?.approvalStatus && (
          <span className={`rounded-lg border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            user.employerProfile.approvalStatus === "APPROVED"
              ? "bg-emerald-50 border-emerald-100 text-emerald-755"
              : user.employerProfile.approvalStatus === "REJECTED"
              ? "bg-red-50 border-red-100 text-red-655"
              : "bg-amber-50 border-amber-100 text-amber-755"
          }`}>
            {user.employerProfile.approvalStatus}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-2">
            {isJobSeeker && user.jobSeekerProfile?.bio
              ? user.jobSeekerProfile.bio
              : isEmployer && user.employerProfile?.description
                ? stripHtml(user.employerProfile.description)
                : "No bio description uploaded yet."}
          </p>
        </div>

        {isJobSeeker && user.jobSeekerProfile?.skills && user.jobSeekerProfile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {user.jobSeekerProfile.skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-semibold text-blue-600">
                {s}
              </span>
            ))}
            {user.jobSeekerProfile.skills.length > 4 && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-450">
                +{user.jobSeekerProfile.skills.length - 4} MORE
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-150/60 pt-5">
        <p className="text-[10px] font-semibold text-slate-400">Created {new Date(user.createdAt).toLocaleDateString("en-GB")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {isEmployer && user.employerProfile ? (
            <>
              {user.employerProfile.approvalStatus !== "APPROVED" && (
                <Button
                  type="button"
                  className="h-9 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  disabled={isUpdating}
                  onClick={() => onUpdateApproval(user.id, "APPROVED")}
                >
                  <span style={{ color: "white" }}>Approve</span>
                </Button>
              )}
              {user.employerProfile.approvalStatus !== "REJECTED" && (
                <Button
                  type="button"
                  className="h-9 px-4 rounded-xl text-xs font-semibold bg-red-650 hover:bg-red-700 text-white transition-colors"
                  disabled={isUpdating}
                  onClick={() => onUpdateApproval(user.id, "REJECTED")}
                >
                  <span style={{ color: "white" }}>Reject</span>
                </Button>
              )}
              <Button
                type="button"
                className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all ${user.employerProfile.resumeSearchEnabled
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                disabled={isUpdating || user.employerProfile.approvalStatus !== "APPROVED"}
                onClick={() =>
                  onToggleResumeAccess(
                    user.id,
                    !Boolean(user.employerProfile?.resumeSearchEnabled)
                  )
                }
              >
                {isUpdating ? (
                  "SYNCING..."
                ) : user.employerProfile.resumeSearchEnabled ? (
                  <span style={{ color: "white" }}>DB ACCESS: ON</span>
                ) : (
                  "DB ACCESS: OFF"
                )}
              </Button>
              <Button
                type="button"
                className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all ${user.employerProfile.resumeUploadEnabled
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                disabled={isUpdating || user.employerProfile.approvalStatus !== "APPROVED"}
                onClick={() =>
                  onToggleResumeUpload(
                    user.id,
                    !Boolean(user.employerProfile?.resumeUploadEnabled)
                  )
                }
              >
                {isUpdating ? (
                  "SYNCING..."
                ) : user.employerProfile.resumeUploadEnabled ? (
                  <span style={{ color: "white" }}>RESUME UPLOAD: ON</span>
                ) : (
                  "RESUME UPLOAD: OFF"
                )}
              </Button>
            </>
          ) : null}
          <Link href={getUserDetailUrl(user.id)}>
            <Button variant="ghost" className="h-9 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all active:scale-95 group">
              View Profile
              <ChevronRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
