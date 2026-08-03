"use client";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  loading?: boolean;
  className?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  loading = false,
  className = "mt-10",
}: PaginationProps) {
  if (loading || totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  const show = 2;
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (page <= show) {
      for (let i = 1; i <= show + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (page >= totalPages - show + 1) {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - show; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("ellipsis");
      for (let i = page - 1; i <= page + 1; i++) pages.push(i);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm disabled:opacity-30"
      >
        ← Previous
      </Button>
      <div className="flex items-center gap-1.5">
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 rounded-xl text-xs font-semibold transition-all ${
                page === p
                  ? "bg-blue-600 text-white shadow-sm border border-blue-650"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 bg-white"
              }`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="h-9 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm disabled:opacity-30"
      >
        Next →
      </Button>
    </div>
  );
}
