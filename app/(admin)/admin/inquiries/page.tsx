import { requireAdmin } from "@/lib/auth-utils";
import AdminInquiriesClient from "@/components/admin/AdminInquiriesClient";

export default async function AdminInquiriesPage() {
  await requireAdmin();

  const containerClass =
    "mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10";

  return (
    <div className="min-h-screen w-full min-w-0 bg-transparent text-slate-800 animate-in fade-in duration-700">
      <div className={containerClass}>
        {/* Header Section */}
        <div className="mb-8 border-b border-slate-200/60 pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Lead & Inquiries Management
            </p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            B2B & B2C <span className="text-blue-600">Inquiries</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Track, manage, and update status for all website contact form submissions, ATS sales leads, and career service requests.
          </p>
        </div>

        <AdminInquiriesClient />
      </div>
    </div>
  );
}
