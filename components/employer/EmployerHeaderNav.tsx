"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmployerNavLinks from "@/components/employer/EmployerNavLinks";
import LogoutButton from "@/components/LogoutButton";

export default function EmployerHeaderNav({
  canAccessResumeSearch,
}: {
  canAccessResumeSearch: boolean;
}) {
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
        <EmployerNavLinks canAccessResumeSearch={canAccessResumeSearch} />
        <div className="flex items-center gap-4 border-l border-white/10 pl-6">
          <LogoutButton />
          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
            Employer
          </span>
        </div>
      </div>

      {/* Mobile: hamburger + full-width panel */}
      <div className="flex items-center gap-3 md:hidden">
        <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
          Employer
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-foreground hover:bg-white/5"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Full-width mobile menu panel below header */}
      {open && (
        <div
          className="fixed inset-x-0 top-20 z-40 flex flex-col glass border-b border-white/5 animate-in slide-in-from-top duration-300 md:hidden"
          style={{ height: "calc(100vh - 5rem)" }}
        >
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <nav className="flex flex-col gap-2">
              <EmployerNavLinks
                vertical
                canAccessResumeSearch={canAccessResumeSearch}
                onLinkClick={() => setOpen(false)}
              />
            </nav>
            <div className="mt-8 border-t border-white/5 pt-8 [&_button]:w-full [&_button]:h-12 [&_button]:justify-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
