"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Archive,
  RefreshCw,
  Eye,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  Save,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDisplayId, formatPhoneForCsv } from "@/lib/utils";

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED";
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Counts {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  archived: number;
}

export default function AdminInquiriesClient() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (subjectFilter !== "ALL") params.set("subject", subjectFilter);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, subjectFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleStatusChange = async (
    id: string,
    newStatus: "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
        if (selectedInquiry?.id === id) {
          setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        // Refresh counts
        fetchInquiries();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedInquiry) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedInquiry(updated);
        setInquiries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this inquiry record?")) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInquiries((prev) => prev.filter((item) => item.id !== id));
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
        fetchInquiries();
      }
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
    }
  };

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (subjectFilter !== "ALL") params.set("subject", subjectFilter);
      }

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const exportInquiries: ContactInquiry[] = data.inquiries ?? [];

      if (exportInquiries.length === 0) {
        alert("No inquiries found to export.");
        return;
      }

      const headers = [
        "Inquiry ID", "System ID", "Name", "Email", "Mobile", "Subject / Category", "Message / Requirements", "Status", "Admin Note", "Created At"
      ];

      const rows = exportInquiries.map((inq, idx) => [
        formatDisplayId(inq.id, "INQ", idx),
        inq.id,
        `"${inq.name.replace(/"/g, '""')}"`,
        `"${inq.email.replace(/"/g, '""')}"`,
        `"${formatPhoneForCsv(inq.mobile).replace(/"/g, '""')}"`,
        `"${inq.subject.replace(/"/g, '""')}"`,
        `"${inq.message.replace(/"/g, '""')}"`,
        inq.status,
        `"${(inq.adminNote || "").replace(/"/g, '""')}"`,
        inq.createdAt ? new Date(inq.createdAt).toISOString().split('T')[0] : ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = applyFilters
        ? `inquiries_filtered_${new Date().toISOString().split('T')[0]}.csv`
        : `inquiries_all_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export inquiries:", err);
      alert("Failed to download inquiries.");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: ContactInquiry["status"]) => {
    switch (status) {
      case "NEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="h-3 w-3" /> New
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock3 className="h-3 w-3" /> In Progress
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="h-3 w-3" /> Archived
          </span>
        );
    }
  };

  const getSubjectBadge = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes("enterprise") || s.includes("ats")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          🏢 B2B: Enterprise ATS
        </span>
      );
    }
    if (s.includes("executive") || s.includes("recruitment")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          👔 B2B: Executive Search
        </span>
      );
    }
    if (s.includes("career") || s.includes("resume")) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          🎓 B2C: Career Services
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        💬 {subject}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-md"
              : "bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Inquiries
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{counts.total}</p>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">All B2B & B2C Leads</p>
        </div>

        <div
          onClick={() => {
            setStatusFilter("NEW");
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "NEW"
              ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-md"
              : "bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              New Leads
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{counts.new}</p>
          <p className="text-[11px] font-semibold text-blue-500 mt-0.5">Requires Initial Contact</p>
        </div>

        <div
          onClick={() => {
            setStatusFilter("IN_PROGRESS");
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-md"
              : "bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              In Progress
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock3 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{counts.inProgress}</p>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Contacted & Discussion</p>
        </div>

        <div
          onClick={() => {
            setStatusFilter("RESOLVED");
            setPage(1);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "RESOLVED"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-md"
              : "bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Resolved
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{counts.resolved}</p>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Completed / Converted</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone..."
            className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Categories</option>
            <option value="Career Services">Career Services (B2C)</option>
            <option value="Enterprise ATS">Enterprise ATS (B2B)</option>
            <option value="Executive Recruitment">Executive Search (B2B)</option>
            <option value="Other Support">General Support</option>
          </select>

          {/* Download Buttons */}
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || loading}
            onClick={() => handleExportCSV(true)}
            className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>{exporting ? "Downloading..." : "Download Filtered"}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || loading}
            onClick={() => handleExportCSV(false)}
            className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
          >
            <Download className="h-4 w-4 text-blue-600" />
            <span>{exporting ? "Downloading..." : "Download All"}</span>
          </Button>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInquiries}
            className="h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Inquiries Table List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-20 text-center px-4">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Inquiries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {search || statusFilter !== "ALL" || subjectFilter !== "ALL"
                ? "Try clearing your search query or filters to see all submissions."
                : "Contact form submissions from your website will automatically appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Category / Subject</th>
                  <th className="py-3.5 px-4">Message Snippet</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      setAdminNote(inquiry.adminNote || "");
                    }}
                  >
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-medium">
                      <div>
                        {new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(inquiry.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="py-4 px-4 min-w-[180px]">
                      <div className="font-bold text-slate-800 text-sm">{inquiry.name}</div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{inquiry.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{inquiry.mobile}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {getSubjectBadge(inquiry.subject)}
                    </td>

                    <td className="py-4 px-4 max-w-[280px]">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed">
                        {inquiry.message}
                      </p>
                      {inquiry.adminNote && (
                        <p className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Note: {inquiry.adminNote}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inquiry.status}
                        disabled={updatingId === inquiry.id}
                        onChange={(e) =>
                          handleStatusChange(
                            inquiry.id,
                            e.target.value as "NEW" | "IN_PROGRESS" | "RESOLVED" | "ARCHIVED"
                          )
                        }
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          inquiry.status === "NEW"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : inquiry.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : inquiry.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="NEW">🔵 New</option>
                        <option value="IN_PROGRESS">🟡 In Progress</option>
                        <option value="RESOLVED">🟢 Resolved</option>
                        <option value="ARCHIVED">⚪ Archived</option>
                      </select>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInquiry(inquiry);
                            setAdminNote(inquiry.adminNote || "");
                          }}
                          className="h-8 px-2.5 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inquiry.id)}
                          className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs font-semibold rounded-lg"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 text-xs font-semibold rounded-lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Inquiry #{selectedInquiry.id.slice(-8).toUpperCase()}
                  </span>
                  {getStatusBadge(selectedInquiry.status)}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedInquiry.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 py-6">
              {/* Category */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Category / Subject
                </label>
                <div className="mt-1.5">{getSubjectBadge(selectedInquiry.subject)}</div>
              </div>

              {/* Quick Contact Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 break-all">
                      {selectedInquiry.email}
                    </span>
                    <a
                      href={`mailto:${selectedInquiry.email}?subject=Regarding your JobDaddy inquiry`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline shrink-0 ml-2"
                    >
                      <Mail className="h-3 w-3" /> Email →
                    </a>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Mobile Phone
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      {selectedInquiry.mobile}
                    </span>
                    <a
                      href={`tel:${selectedInquiry.mobile}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline shrink-0 ml-2"
                    >
                      <Phone className="h-3 w-3" /> Call →
                    </a>
                  </div>
                </div>
              </div>

              {/* Full Message */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Message / Requirements
                </label>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Change Status
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(
                    [
                      { id: "NEW", label: "🔵 Mark as New" },
                      { id: "IN_PROGRESS", label: "🟡 Mark as In Progress" },
                      { id: "RESOLVED", label: "🟢 Mark as Resolved" },
                      { id: "ARCHIVED", label: "⚪ Mark as Archived" },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(selectedInquiry.id, st.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedInquiry.status === st.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Internal Admin Note (Private)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Called on Tuesday, sent ATS demo proposal..."
                    className="flex-1 h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {savingNote ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
              <span>
                Received on:{" "}
                {new Date(selectedInquiry.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInquiry(null)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
