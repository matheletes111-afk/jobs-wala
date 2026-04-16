import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, FileText } from "lucide-react";

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen w-full min-w-0 bg-background text-foreground animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-16 sm:px-6 md:px-8 lg:px-10 lg:py-20">
        {/* Header Section */}
        <div className="mb-20 border-b border-white/5 pb-12">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Data Export</p>
           </div>
           <h1 className="text-4xl font-black md:text-6xl tracking-tighter text-white">
             Reports <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">& Analytics</span>
           </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic">
             Export system data and generate comprehensive platform reports.
           </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* User Export Node */}
          <div className="linear-card group rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 transition-all hover:bg-white/[0.05] hover:border-blue-500/20 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
               <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 italic">01</span>
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight mb-3">User Registry</h3>
            <p className="text-sm font-medium text-muted-foreground/40 italic mb-10">Export all users, roles, and profiles to CSV.</p>
            
            <form action="/api/admin/export/users" method="GET">
              <Button type="submit" className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:from-blue-700 hover:to-orange-600 hover:scale-[1.02] active:scale-95 transition-all">
                Export CSV
              </Button>
            </form>
          </div>

          {/* Jobs Export Node */}
          <div className="linear-card group rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 transition-all hover:bg-white/[0.05] hover:border-blue-500/20 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
               <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 italic">02</span>
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight mb-3">Jobs List</h3>
            <p className="text-sm font-medium text-muted-foreground/40 italic mb-10">Export all active, pending, and closed jobs.</p>
            
            <form action="/api/admin/export/jobs" method="GET">
              <Button type="submit" className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:from-blue-700 hover:to-orange-600 hover:scale-[1.02] active:scale-95 transition-all">
                Export CSV
              </Button>
            </form>
          </div>

          {/* Applications Export Node */}
          <div className="linear-card group rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-10 transition-all hover:bg-white/[0.05] hover:border-blue-500/20 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
               <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 italic">03</span>
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight mb-3">Applications</h3>
            <p className="text-sm font-medium text-muted-foreground/40 italic mb-10">Export applications and status updates.</p>
            
            <form action="/api/admin/export/applications" method="GET">
              <Button type="submit" className="h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:from-blue-700 hover:to-orange-600 hover:scale-[1.02] active:scale-95 transition-all">
                Export CSV
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
