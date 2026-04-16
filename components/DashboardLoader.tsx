import { Loader2, ShieldCheck } from "lucide-react";

export default function DashboardLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10 bg-black backdrop-blur-3xl px-4 relative overflow-hidden rounded-[3rem] border border-white/5 my-12 mx-4 md:mx-8">
      {/* Background Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
      
      <div className="relative group">
        {/* Outer Pulsing Ring */}
        <div className="absolute -inset-8 animate-pulse rounded-full bg-blue-600/5 blur-xl" />
        <div className="absolute -inset-4 animate-ping rounded-full bg-blue-600/10" />
        
        {/* Core Loader Node */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl shadow-blue-600/20 transition-transform group-hover:scale-110 duration-500">
           <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={3} />
           <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
        </div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Access Verified</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase italic">Loading Your Dashboard</h2>
        <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest animate-pulse italic">Synchronizing your professional profile...</p>
      </div>
      
      {/* Technical Scan Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-primary/50 to-transparent animate-scan" />
    </div>
  );
}
