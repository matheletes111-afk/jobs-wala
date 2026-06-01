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
      <div className="hidden items-center gap-6 md:flex">
        <AdminNavLinks />
        <div className="flex items-center gap-4 h-10 border-l border-slate-200 pl-6">
          <LogoutButton />
          <span className="flex h-8 items-center rounded-full bg-blue-600/10 border border-blue-600/20 px-4 text-xs font-semibold text-[#2563eb] shadow-lg shadow-blue-500/5">
            Admin
          </span>
        </div>
      </div>

      {/* Mobile: hamburger + badge */}
      <div className="flex items-center gap-3 md:hidden">
        <span className="rounded-full bg-blue-600/10 border border-blue-600/20 px-3 py-1 text-xs font-semibold text-[#2563eb]">
          Admin
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-sm border border-slate-200 transition-all active:scale-90"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Full-width mobile menu panel below header */}
      {open && (
        <div
          className="fixed inset-x-0 top-20 z-40 flex flex-col bg-background/95 backdrop-blur-2xl md:hidden animate-in slide-in-from-top duration-500"
          style={{ height: "calc(100vh - 5rem)" }}
        >
          <div className="flex-1 overflow-y-auto px-6 py-10">
            <nav className="flex flex-col gap-4">
               <div className="mb-6 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground opacity-40">Admin Menu</span>
               </div>
              <AdminNavLinks vertical onLinkClick={() => setOpen(false)} />
            </nav>
            <div className="mt-12 border-t border-slate-200 pt-10 flex flex-col gap-6">
              <LogoutButton />
              <div className="flex items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Admin Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
