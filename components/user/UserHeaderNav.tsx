"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, User, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserNavLinks from "@/components/user/UserNavLinks";

interface UserHeaderNavProps {
  userEmail?: string;
}

export default function UserHeaderNav({ userEmail }: UserHeaderNavProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const realEmail = session?.user?.email || userEmail || "candidate@jobdaddy.com";
  const realName = session?.user?.name || "Candidate";
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: "/login",
        redirect: false 
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <>
      {/* Desktop nav: visible from md up */}
      <div className="hidden items-center gap-3 xl:gap-4 md:flex relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-full bg-slate-100/80 border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-800 transition-colors"
        >
          <div className="h-5 w-5 rounded-full bg-blue-500/10 border border-blue-200 flex items-center justify-center shrink-0">
            <User className="h-3 w-3 text-blue-600" />
          </div>
          <span className="max-w-[200px] truncate">{realEmail}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-11 z-55 w-56 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-2.5 py-2 border-b border-slate-100 mb-2">
              <p className="text-xs font-bold text-slate-800 truncate">{realName}</p>
              <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{realEmail}</p>
            </div>
            <Link
              href="/user/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <User className="h-4 w-4 text-slate-400" />
              View Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 hover:text-red-750 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile: hamburger + drawer */}
      <div className="flex items-center gap-3 md:hidden">
        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600">
          Candidate
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile menu panel below header */}
      {open && (
        <div
          className="fixed inset-x-0 top-20 z-40 flex flex-col bg-white border-b border-slate-200 shadow-lg animate-in slide-in-from-top duration-300 md:hidden"
          style={{ height: "calc(100vh - 5rem)" }}
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
            <nav className="flex flex-col gap-2">
              <UserNavLinks vertical onLinkClick={() => setOpen(false)} />
            </nav>
            <div className="mt-8 border-t border-slate-100 pt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{realName}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">{realEmail}</p>
                </div>
              </div>
              <Link
                href="/user/profile"
                onClick={() => setOpen(false)}
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="h-4.5 w-4.5 text-slate-500" />
                View Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200/60 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4.5 w-4.5 text-red-500" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
