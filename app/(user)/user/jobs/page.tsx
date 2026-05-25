import { requireJobSeeker } from "@/lib/auth-utils";
import JobSearch from "@/components/user/JobSearch";

export default async function JobsPage() {
  await requireJobSeeker();

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent/50 backdrop-blur-3xl">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-12 sm:px-6 md:px-8 lg:px-10 lg:py-24">
        {/* Command Center Header */}
        <div className="mb-16 border-b border-white/5 pb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Available Opportunities</p>
           </div>
           <h1 className="text-4xl font-black text-foreground md:text-6xl tracking-tighter leading-tight">
             Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Portal</span>
           </h1>
           <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic max-w-2xl">
             Discover your next career move. Browse and apply for the latest job opportunities across our global network.
           </p>
        </div>
        <JobSearch />
      </div>
    </div>
  );
}
