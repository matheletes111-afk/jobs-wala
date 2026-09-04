"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, Tag, Building2, ChevronRight, X } from "lucide-react";
import Link from "next/link";

interface Suggestion {
  type: "title" | "skill" | "company";
  label: string;
  value: string;
}

export default function HomeHeroSearch() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [searchType, setSearchType] = useState<"all" | "title" | "skill" | "company">("all");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/jobs/suggest?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedIndex(-1);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 200);
  };

  const handleSelectSuggestion = (item: Suggestion) => {
    setSearch(item.value);
    setSearchType(item.type);
    setShowSuggestions(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (searchType !== "all") params.set("searchType", searchType);
    if (location.trim()) params.set("location", location.trim());

    const query = params.toString();
    router.push(`/jobs/browse${query ? `?${query}` : ""}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < suggestions.length) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const getTypeBadge = (type: "title" | "skill" | "company") => {
    switch (type) {
      case "title":
        return {
          icon: <Briefcase className="h-3.5 w-3.5 text-blue-600" />,
          label: "Job Title",
          classes: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "skill":
        return {
          icon: <Tag className="h-3.5 w-3.5 text-purple-600" />,
          label: "Skill",
          classes: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "company":
        return {
          icon: <Building2 className="h-3.5 w-3.5 text-emerald-600" />,
          label: "Company",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-sky-50/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 md:p-6 w-full max-w-xl mx-auto lg:mx-0 mb-6 relative z-20"
    >
      <p className="mb-4 text-xs md:text-sm text-slate-500 font-semibold text-left leading-relaxed">
        Our AI technology matches your skills with the right opportunities, so you can focus on what matters – building your future.
      </p>

      {/* Target Category Pills */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Filter By:</span>
        {(
          [
            { id: "all", label: "All" },
            { id: "title", label: "💼 Job Titles" },
            { id: "skill", label: "🏷️ Skills" },
            { id: "company", label: "🏢 Companies" },
          ] as const
        ).map((tab) => {
          const isSelected = searchType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchType(tab.id)}
              style={isSelected ? { color: "#ffffff", backgroundColor: "#2563eb", borderColor: "#2563eb" } : {}}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span style={{ color: isSelected ? "#ffffff" : "#475569" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row items-end gap-5 mb-5 relative">
        {/* Input block 1: Job title, skills or company with Smart Suggestions */}
        <div className="flex-1 flex flex-col gap-2 w-full text-left relative">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-800">Job title, skills or company</label>
            {searchType !== "all" && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded capitalize">
                Filtering by: {searchType}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={
                searchType === "title"
                  ? "e.g. Full Stack Developer"
                  : searchType === "skill"
                  ? "e.g. React.js, Python, AWS"
                  : searchType === "company"
                  ? "e.g. Jobdaddy"
                  : "e.g. Software Eng"
              }
              className="search-input w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
              style={{
                height: "48px",
                padding: "0 16px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSearchType("all");
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Smart Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Intelligent Suggestions</span>
                <span>{suggestions.length} Found</span>
              </div>
              <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {suggestions.map((item, index) => {
                  const badge = getTypeBadge(item.type);
                  const isSelected = index === selectedIndex;
                  return (
                    <li key={`${item.type}-${item.value}-${index}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="shrink-0">{badge.icon}</span>
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.classes}`}
                          >
                            {badge.label}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Input block 2: Location */}
        <div className="flex-1 flex flex-col gap-2 w-full text-left">
          <label className="text-sm font-bold text-slate-800">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bangalore"
            className="search-input w-full text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
            style={{
              height: "48px",
              padding: "0 16px",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
            }}
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="h-12 w-full md:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          style={{ color: "white", background: "#2563eb", border: "none", borderRadius: "12px" }}
        >
          <Search className="h-4 w-4" style={{ stroke: "white" }} />
          <span style={{ color: "white" }}>Search Jobs</span>
        </button>
      </form>

      {/* Popular Searches */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 text-left">
        <span className="font-bold text-slate-700 mr-1">Popular Searches:</span>
        {[
          { label: "Software Developer", type: "title" as const },
          { label: "Sales", type: "title" as const },
          { label: "Marketing", type: "title" as const },
          { label: "Data Analyst", type: "title" as const },
          { label: "Customer Support", type: "title" as const },
        ].map((item) => (
          <Link
            key={item.label}
            href={`/jobs/browse?search=${encodeURIComponent(item.label)}&searchType=${item.type}`}
            className="px-2.5 py-1 rounded-lg bg-blue-50/60 hover:bg-blue-100/80 text-[#2563eb] font-semibold transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
