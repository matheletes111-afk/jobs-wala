import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format resume/CV last updated for display (e.g. "2 days ago", "15 Jan 2025") */
export function formatResumeUpdatedAt(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatLocation(location: string | null | undefined): string {
  if (!location || location.trim() === "") return "Not specified";
  
  try {
    const locationData = JSON.parse(location);
    const parts: string[] = [];
    
    // Handle both lowercase and capitalized keys for backward compatibility
    const city = locationData.city || locationData.City;
    const state = locationData.state || locationData.State;
    const country = locationData.country || locationData.Country;
    
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country) parts.push(country);
    
    return parts.length > 0 ? parts.join(", ") : location;
  } catch (e) {
    // If it's not JSON, return as is (for backward compatibility)
    return location;
  }
}
