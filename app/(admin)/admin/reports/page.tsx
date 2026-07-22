import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Briefcase, FileText } from "lucide-react";

export default async function AdminReportsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
        {/* Header Section */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
           <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Data Export</p>
           </div>
           <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
             Reports <span className="text-blue-600">& Analytics</span>
           </h1>
           <p className="mt-1.5 text-sm font-medium text-slate-500">
             Export system data and generate comprehensive platform reports.
           </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Export Node */}
          <div className="bg-white border border-slate-200 group rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-500/50">
            <div className="mb-6 flex items-center justify-between">
               <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 transition-transform">
                  <BarChart3 className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">01</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">User Registry</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Export all users, roles, and profiles to CSV.</p>
            
            <form action="/api/admin/export/users" method="GET">
              <Button type="submit" className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors">
                <span style={{ color: "white" }}>Export CSV</span>
              </Button>
            </form>
          </div>

          {/* Jobs Export Node */}
          <div className="bg-white border border-slate-200 group rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-500/50">
            <div className="mb-6 flex items-center justify-between">
               <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 transition-transform">
                  <Briefcase className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">02</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Jobs List</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Export all active, pending, and closed jobs.</p>
            
            <form action="/api/admin/export/jobs" method="GET">
              <Button type="submit" className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors">
                <span style={{ color: "white" }}>Export CSV</span>
              </Button>
            </form>
          </div>

          {/* Applications Export Node */}
          <div className="bg-white border border-slate-200 group rounded-2xl p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-500/50">
            <div className="mb-6 flex items-center justify-between">
               <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 transition-transform">
                  <FileText className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">03</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">Applications</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">Export applications and status updates.</p>
            
            <form action="/api/admin/export/applications" method="GET">
              <Button type="submit" className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors">
                <span style={{ color: "white" }}>Export CSV</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
