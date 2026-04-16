import { requireJobSeeker } from "@/lib/auth-utils";
import ApplicationSearch from "@/components/user/ApplicationSearch";

export default async function ApplicationsPage() {
  await requireJobSeeker();

  return (
    <div className="min-h-screen w-full min-w-0 bg-background">
      <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-16">
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-primary">
            Track Applications
          </p>
          <h1 className="mb-4 text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Applications</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl">
            Real-time tracking of your professional outreach and application status.
          </p>
        </div>
        <ApplicationSearch />
      </div>
    </div>
  );
}
