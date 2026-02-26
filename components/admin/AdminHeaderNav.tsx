"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminNavLinks from "@/components/admin/AdminNavLinks";
import LogoutButton from "@/components/LogoutButton";

export default function AdminHeaderNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Desktop nav: visible from md up */}
      <div className="hidden items-center gap-2 sm:gap-3 md:flex">
        <AdminNavLinks />
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3 sm:pl-4">
          <LogoutButton />
          <span className="rounded bg-[#2563eb] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Admin
          </span>
        </div>
      </div>

      {/* Mobile: hamburger + full-width panel (like 2nd ss view) */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="rounded bg-[#2563eb] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          Admin
        </span>
      </div>

      {/* Full-width mobile menu panel below header - visible in "2nd ss" view */}
      {open && (
        <div
          className="fixed inset-x-0 top-16 z-40 flex flex-col bg-gray-50/95 shadow-lg md:hidden"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="flex flex-col gap-1">
              <AdminNavLinks vertical onLinkClick={() => setOpen(false)} />
            </nav>
            <div className="mt-6 border-t border-gray-200 pt-4 [&_button]:w-full [&_button]:justify-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
