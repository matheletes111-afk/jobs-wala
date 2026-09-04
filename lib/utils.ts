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

/**
 * Formats a phone number or numeric string for CSV export so that Excel / Google Sheets
 * renders it as plain text instead of converting it to scientific notation (e.g., 9.198E+11)
 * or stripping leading zeroes.
 */
export function formatPhoneForCsv(phone: string | number | null | undefined): string {
  if (!phone) return "";
  const str = String(phone).trim();
  if (!str) return "";
  // Tab prefix \t instructs Excel to treat the cell contents strictly as text without visible artifact
  return `\t${str}`;
}

/**
 * Formats internal system IDs (e.g. CUIDs "cmn8kt7qq0001ky046m5ay1wi") into professional,
 * human-readable identifiers for exports, downloads, and administrative tables.
 *
 * Examples:
 * - CAND: Job Seeker / Candidate  -> JD-CAND-0001
 * - EMP:  Employer / Company      -> JD-EMP-0001
 * - ADM:  Administrator           -> JD-ADM-0001
 * - USER: General User            -> JD-USR-0001
 * - JOB:  Job Posting             -> JD-JOB-0001
 * - CAT:  Category                -> JD-CAT-0001
 * - APP:  Job Application         -> JD-APP-0001
 * - RES:  Resume Document         -> JD-RES-0001
 * - INQ:  Contact / Lead Inquiry  -> JD-INQ-0001
 */
export function formatDisplayId(
  id: string | null | undefined,
  type: "CAND" | "EMP" | "ADM" | "USER" | "JOB" | "CAT" | "APP" | "RES" | "INQ" | "SUB" = "USER",
  index?: number
): string {
  if (!id) return "N/A";

  if (typeof index === "number" && index >= 0) {
    const num = String(index + 1).padStart(4, "0");
    return `JD-${type}-${num}`;
  }

  // Create a clean uppercase 6-char alphanumeric suffix from the end of the ID
  const cleanSuffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `JD-${type}-${cleanSuffix || "0001"}`;
}

export function formatLocation(location: string | null | undefined, short: boolean = false): string {
  if (!location || location.trim() === "") return "Not specified";

  try {
    const locationData = JSON.parse(location);
    const parts: string[] = [];

    // Handle both lowercase and capitalized keys for backward compatibility
    let city = locationData.city || locationData.City;
    let state = locationData.state || locationData.State;
    let country = locationData.country || locationData.Country;

    // Parse stringified arrays if any
    if (typeof city === "string") {
      if (city.startsWith("[")) {
        try { city = JSON.parse(city); } catch { city = city.replace(/[\[\]"]/g, ""); }
      } else {
        city = city.replace(/[\[\]"]/g, "");
      }
    }
    if (typeof state === "string") {
      if (state.startsWith("[")) {
        try { state = JSON.parse(state); } catch { state = state.replace(/[\[\]"]/g, ""); }
      } else {
        state = state.replace(/[\[\]"]/g, "");
      }
    }
    if (typeof country === "string") {
      country = country.replace(/[\[\]"]/g, "");
    }

    // Ensure array for consistent handling and clean elements
    const cleanElement = (el: any): string => typeof el === "string" ? el.replace(/[\[\]"]/g, "").trim() : String(el);
    const cities = (Array.isArray(city) ? city : city ? [city] : []).map(cleanElement).filter(Boolean);
    const states = (Array.isArray(state) ? state : state ? [state] : []).map(cleanElement).filter(Boolean);
    const cleanCountry = country ? cleanElement(country) : "";

    if (short) {
      if (cities.length > 0) parts.push(cities[0]);
      if (states.length > 0) parts.push(states[0]);
      if (cleanCountry) parts.push(cleanCountry);

      const moreCount = Math.max(0, cities.length - 1) + Math.max(0, states.length - 1);
      if (moreCount > 0) {
        return parts.join(", ") + ` and ${moreCount} more`;
      }
      return parts.length > 0 ? parts.join(", ") : location.replace(/[\[\]"]/g, "");
    } else {
      if (cities.length > 0) parts.push(cities.join(", "));
      if (states.length > 0) parts.push(states.join(", "));
      if (cleanCountry) parts.push(cleanCountry);

      return parts.length > 0 ? parts.join(" | ") : location.replace(/[\[\]"]/g, "");
    }
  } catch (_e) {
    // If it's not JSON, return as is (for backward compatibility) but clean any brackets
    return location.replace(/[\[\]"]/g, "");
  }
}

export const PAY_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

interface SalaryInfo {
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  salaryRange?: string | null;
}

export function formatSalary(job: SalaryInfo): string | null {
  const curr = job.currency || "";
  const pay = job.payType ? PAY_TYPE_LABELS[job.payType] || job.payType : "";
  const paySuffix = pay ? ` (${pay})` : "";

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${curr} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}${paySuffix}`.trim();
  }
  if (job.salaryMin != null) {
    return `${curr} ${job.salaryMin.toLocaleString()}+ ${paySuffix}`.trim();
  }
  if (job.salaryMax != null) {
    return `Up to ${curr} ${job.salaryMax.toLocaleString()}${paySuffix}`.trim();
  }
  if (job.salaryRange) {
    return `${job.salaryRange}${paySuffix}`.trim();
  }
  if (pay) {
    return pay;
  }
  return null;
}

/**
 * Strips HTML tags and decodes common HTML entities.
 * Use this ONLY for list/card snippet previews — NOT on detail pages which use dangerouslySetInnerHTML.
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    // Remove <style> and <script> blocks entirely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&bull;/gi, "•")
    .replace(/&copy;/gi, "©")
    .replace(/&reg;/gi, "®")
    // Collapse multiple spaces/newlines into one
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Resolves the canonical app base URL reliably in all environments (production domain, custom env, or request headers).
 */
export function getAppBaseUrl(headers?: Headers | null): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (headers) {
    const host = headers.get("x-forwarded-host") || headers.get("host") || "localhost:3000";
    const protocol = headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }
  return "https://jobdaddy.in";
}

