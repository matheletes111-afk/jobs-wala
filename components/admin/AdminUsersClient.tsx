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
import { Search, LayoutGrid, List, ChevronDown, ChevronRight, Briefcase, User } from "lucide-react";
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
    resumeSearchEnabled?: boolean;
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
  const [updatingAccessFor, setUpdatingAccessFor] = useState<string | null>(null);

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
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10";

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

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground animate-in fade-in duration-1000">
      <div className={containerClass}>
        {/* Registry Access Header */}
        <div className="mb-16 border-b border-white/5 pb-12">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">User Management</p>
           </div>
            <h1 className="text-4xl font-black md:text-6xl tracking-tighter text-white">
              User <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Management</span>
            </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
             Manage system users, view profiles, and update access permissions.
           </p>
           
           <div className="mt-12 flex flex-wrap items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-3xl">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 opacity-50" />
                <Input
                  placeholder="Search name, email or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-12 pl-12 bg-transparent border-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/30 font-bold uppercase tracking-widest text-[10px]"
                />
              </div>
              <div className="w-[180px]">
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10">
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
                    <SelectItem value="EMPLOYER">Employer</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-12 px-8 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Search Users
              </Button>
           </div>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Tactical Filters Sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="linear-card sticky top-32 rounded-[2.5rem] p-8 bg-white/[0.02] border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Filters</h2>
              </div>
              
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Search Name
                  </label>
                  <Input
                    placeholder="Keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    User Role
                  </label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="JOB_SEEKER">Job Seeker</SelectItem>
                      <SelectItem value="EMPLOYER">Employer</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-6 flex flex-col gap-3">
                   <Button
                    onClick={handleSearch}
                    className="h-14 w-full rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClear}
                    className="h-12 w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
              
              <div className="mt-12 p-6 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10">
                 <p className="text-[9px] leading-relaxed text-muted-foreground/60 font-medium italic">
                    Use filters to easily find specific users in the platform.
                 </p>
              </div>
            </div>
          </aside>

          {/* Result Grid */}
          <div className="flex-1 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
              <div className="flex flex-col gap-1">
                 <p className="text-3xl font-black text-foreground tracking-tighter tabular-nums">
                   {total} <span className="text-sm font-black uppercase tracking-widest text-blue-500 opacity-60 ml-2">Found</span>
                 </p>
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                    Showing {start} - {end} users
                 </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex p-1 rounded-xl bg-white/5 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "grid" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="Grid Scan"
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`rounded-lg p-2.5 transition-all ${viewMode === "list" ? "toggle-active" : "text-muted-foreground hover:bg-white/5"}`}
                    aria-label="List View"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="relative group">
                   <div className="flex items-center gap-3 h-12 px-5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all cursor-pointer">
                      <span className="opacity-40">SORT:</span> {sort === "recent" ? "LATEST" : "OLDEST"}
                      <ChevronDown className="h-4 w-4 opacity-40 ml-1" />
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
              <div className="linear-card rounded-[3rem] p-32 text-center animate-pulse">
                <p className="text-sm font-black uppercase tracking-[0.5em] text-blue-500">Loading...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="linear-card rounded-[3rem] p-32 text-center border-dashed border-white/10">
                <p className="text-xl font-black text-muted-foreground/40 uppercase tracking-widest italic leading-relaxed">
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
                    isUpdating={updatingAccessFor === user.id}
                    index={idx}
                  />
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous Page
                </Button>
                <div className="px-8 flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Page</p>
                   <p className="text-xl font-black mt-1 tabular-nums">{page} <span className="opacity-20">/</span> {totalPages}</p>
                </div>
                <Button
                  variant="ghost"
                  className="h-12 px-8 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next Page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCard({
  user,
  onToggleResumeAccess,
  isUpdating,
  index,
}: {
  user: UserItem;
  onToggleResumeAccess: (userId: string, enabled: boolean) => Promise<void>;
  isUpdating: boolean;
  index: number;
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
       className="linear-card group flex flex-col rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 transition-all hover:bg-white/[0.05] animate-in fade-in slide-in-from-bottom-5 duration-700"
       style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-10">
        <div className="flex items-center gap-6">
          <Avatar className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white/10 shadow-2xl transition-transform group-hover:scale-110">
            {logoUrl ? (
              <AvatarImage src={logoUrl} alt={displayName} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-blue-500/10 text-blue-500 text-xl font-black">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
             <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${isJobSeeker ? "bg-emerald-400" : isEmployer ? "bg-blue-400" : "bg-blue-500"}`} />
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">{user.role.replace("_", " ")}</p>
             </div>
             <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1 group-hover:text-blue-500 transition-colors">{displayName}</h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1 italic">{subtitle}</p>
          </div>
        </div>
        
        {isJobSeeker && user.jobSeekerProfile?.availabilityStatus && (
           <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
             {user.jobSeekerProfile.availabilityStatus}
           </span>
        )}
      </div>

      <div className="flex-1 space-y-8">
         <div className="p-6 rounded-[1.5rem] bg-white/5 border border-white/5">
            <p className="text-sm leading-relaxed text-muted-foreground font-medium italic line-clamp-2">
               {isJobSeeker && user.jobSeekerProfile?.bio 
                 ? `&quot;${user.jobSeekerProfile.bio}&quot;`
                 : isEmployer && user.employerProfile?.description
                   ? `&quot;${user.employerProfile.description}&quot;`
                   : "Transmission historical data pending verification..."}
            </p>
         </div>

         {isJobSeeker && user.jobSeekerProfile?.skills && user.jobSeekerProfile.skills.length > 0 && (
           <div className="flex flex-wrap gap-2">
              {user.jobSeekerProfile.skills.slice(0, 4).map((s) => (
                <span key={s} className="px-4 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-500/80">
                  {s}
                </span>
              ))}
              {user.jobSeekerProfile.skills.length > 4 && (
                <span className="px-4 py-1.5 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                  +{user.jobSeekerProfile.skills.length - 4} MORE
                </span>
              )}
           </div>
         )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/5 pt-10">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">LOGGED: {new Date(user.createdAt).toLocaleDateString("en-GB")}</p>
        <div className="flex items-center gap-3">
          {isEmployer && user.employerProfile ? (
            <Button
              type="button"
              className={`h-10 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                user.employerProfile.resumeSearchEnabled 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
              disabled={isUpdating}
              onClick={() =>
                onToggleResumeAccess(
                  user.id,
                  !Boolean(user.employerProfile?.resumeSearchEnabled)
                )
              }
            >
              {isUpdating
                ? "SYNCING..."
                : user.employerProfile.resumeSearchEnabled
                  ? "DB ACCESS: ON"
                  : "DB ACCESS: OFF"}
            </Button>
          ) : null}
          <Link href={`/admin/users/${user.id}`}>
            <Button variant="ghost" className="h-10 px-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all active:scale-95 group">
              View Profile
              <ChevronRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
