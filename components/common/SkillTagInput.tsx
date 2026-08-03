"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SkillTagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SkillTagInput({
  value,
  onChange,
  placeholder = "Add skills...",
  className = "",
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/common/skills?query=${encodeURIComponent(inputValue.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected skills
          setSuggestions(data.filter((s: string) => !value.includes(s)));
        }
      } catch (error) {
        console.error("Failed to fetch skill suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputValue, value]);

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !value.includes(trimmedSkill)) {
      onChange([...value, trimmedSkill]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(value.filter((s) => s !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      addSkill(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 min-h-[2.75rem] h-11 px-3 py-1 rounded-xl bg-slate-50/80 border border-slate-200 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-300 overflow-hidden">
        {value.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700 group hover:bg-emerald-100 transition-all shrink-0"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="hover:text-emerald-900 text-emerald-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="no-border-input flex-1 min-w-[120px] bg-transparent border-0 border-none outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none shadow-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 p-0 m-0"
        />
      </div>

      {showSuggestions && (inputValue.trim() || loading) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          ) : suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : inputValue.trim() ? (
            <div className="p-4 text-sm font-medium text-slate-500 text-center italic">
              Press Enter to add &quot;{inputValue}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
