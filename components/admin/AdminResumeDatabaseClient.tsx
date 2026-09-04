"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Upload,
  FileText,
  MapPin,
  Mail,
  Phone,
  CalendarDays,
  CircleCheckBig,
  CircleX,
  Briefcase,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  GitMerge,
  Layers,
  CheckSquare,
  Square,
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import SkillTagInput from "@/components/common/SkillTagInput";
import { matchSkill, isBooleanExpression, extractSearchTerms } from "@/lib/skill-match";
import { formatPhoneForCsv, formatDisplayId } from "@/lib/utils";

type ParseStatus = "all" | "PENDING" | "PARSED" | "FAILED";

interface ResumeItem {
  id: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  r2Key: string;
  r2Url: string;
  parseStatus: "PENDING" | "PARSED" | "FAILED";
  parseError: string | null;
  extractedName: string | null;
  extractedEmail: string | null;
  extractedPhone?: string | null;
  extractedLocation: string | null;
  experienceYears: number | null;
  currentTitle: string | null;
  skills: string[];
  createdAt: string;
}

interface ResumeFetchResult {
  resumes: ResumeItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

interface BulkUploadResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  createdDocs?: Array<{
    originalFileName: string;
    parseStatus: string;
    parseError?: string | null;
  }>;
}

async function readApiError(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  const prefix = `HTTP ${res.status} (${contentType || "no-content-type"}) ${res.url}\n`;
  try {
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { error?: string; details?: string };
      return prefix + (data.error || data.details || "Request failed");
    }
  } catch {
    // ignore
  }
  try {
    const text = await res.text();
    return prefix + text.slice(0, 200);
  } catch {
    return prefix + "Request failed";
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export default function AdminResumeDatabaseClient({
  searchParams: initialParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeRequestRef = useRef<AbortController | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [exporting, setExporting] = useState(false);

  // Multi-select & Deduplication states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [primaryMergeId, setPrimaryMergeId] = useState<string>("");
  const [duplicatesOnly, setDuplicatesOnly] = useState(
    initialParams?.duplicatesOnly === "true"
  );
  const [appliedDuplicatesOnly, setAppliedDuplicatesOnly] = useState(
    initialParams?.duplicatesOnly === "true"
  );

  const initialSkillsStr = (initialParams?.skills as string) || "";
  const initialIsBoolean =
    initialParams?.isBooleanSearch === "true" || isBooleanExpression(initialSkillsStr);

  const [keyword, setKeyword] = useState((initialParams?.keyword as string) || "");
  const [skills, setSkills] = useState<string[]>(
    !initialIsBoolean && initialSkillsStr
      ? initialSkillsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : []
  );
  const [isBooleanSearch, setIsBooleanSearch] = useState(initialIsBoolean);
  const [booleanSkillsExpr, setBooleanSkillsExpr] = useState(
    initialIsBoolean ? initialSkillsStr : ""
  );
  const [location, setLocation] = useState((initialParams?.location as string) || "");
  const [parseStatus, setParseStatus] = useState<ParseStatus>(
    (initialParams?.parseStatus as ParseStatus) || "all"
  );
  const [minExperience, setMinExperience] = useState(
    (initialParams?.minExperience as string) || ""
  );
  const [maxExperience, setMaxExperience] = useState(
    (initialParams?.maxExperience as string) || ""
  );

  const [appliedKeyword, setAppliedKeyword] = useState(keyword);
  const [appliedSkills, setAppliedSkills] = useState(initialSkillsStr);
  const [appliedIsBooleanSearch, setAppliedIsBooleanSearch] = useState(initialIsBoolean);
  const [appliedLocation, setAppliedLocation] = useState(location);
  const [appliedParseStatus, setAppliedParseStatus] = useState<ParseStatus>(parseStatus);
  const [appliedMinExperience, setAppliedMinExperience] = useState(minExperience);
  const [appliedMaxExperience, setAppliedMaxExperience] = useState(maxExperience);

  const limit = 10;

  const updateUrl = useCallback(
    (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      isBooleanSearchVal: boolean,
      locationVal: string,
      parseStatusVal: ParseStatus,
      minExpVal: string,
      maxExpVal: string,
      duplicatesOnlyVal: boolean = false
    ) => {
      const params = new URLSearchParams();
      if (pageNum > 1) params.set("page", String(pageNum));
      if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
      if (skillsVal.trim()) params.set("skills", skillsVal.trim());
      if (isBooleanSearchVal) params.set("isBooleanSearch", "true");
      if (locationVal.trim()) params.set("location", locationVal.trim());
      if (parseStatusVal && parseStatusVal !== "all") params.set("parseStatus", parseStatusVal);
      if (minExpVal.trim()) params.set("minExperience", minExpVal.trim());
      if (maxExpVal.trim()) params.set("maxExperience", maxExpVal.trim());
      if (duplicatesOnlyVal) params.set("duplicatesOnly", "true");
      const query = params.toString();
      router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    },
    [pathname, router]
  );

  const fetchResumes = useCallback(
    async (
      pageNum: number,
      keywordVal: string,
      skillsVal: string,
      isBooleanSearchVal: boolean,
      locationVal: string,
      parseStatusVal: ParseStatus,
      minExperienceVal: string,
      maxExperienceVal: string,
      duplicatesOnlyVal: boolean = false
    ) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }
      const controller = new AbortController();
      activeRequestRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(limit));
        if (keywordVal.trim()) params.set("keyword", keywordVal.trim());
        if (skillsVal.trim()) params.set("skills", skillsVal.trim());
        if (isBooleanSearchVal) params.set("isBooleanSearch", "true");
        if (locationVal.trim()) params.set("location", locationVal.trim());
        params.set("parseStatus", parseStatusVal);
        if (minExperienceVal.trim()) {
          params.set("minExperience", minExperienceVal.trim());
        }
        if (maxExperienceVal.trim()) {
          params.set("maxExperience", maxExperienceVal.trim());
        }
        if (duplicatesOnlyVal) {
          params.set("duplicatesOnly", "true");
        }

        const res = await fetch(`/api/admin/resume-database?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await readApiError(res));
        const data: ResumeFetchResult = await res.json();

        if (controller.signal.aborted) return;

        setResumes(data.resumes ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? 1);
      } catch (err: any) {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setResumes([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [limit]
  );

  const getParam = useCallback(
    (key: string): string | null => {
      const fromHook = searchParams.get(key);
      if (fromHook !== null) return fromHook;
      if (initialParams && typeof initialParams[key] === "string") {
        return initialParams[key] as string;
      }
      return null;
    },
    [searchParams, initialParams]
  );

  // Sync state with searchParams (URL) and sessionStorage
  useEffect(() => {
    let kw = getParam("keyword");
    let sk = getParam("skills");
    let isBoolParam = getParam("isBooleanSearch");
    let loc = getParam("location");
    let pStatus = getParam("parseStatus") as ParseStatus | null;
    let minExp = getParam("minExperience");
    let maxExp = getParam("maxExperience");
    let dupsOnlyParam = getParam("duplicatesOnly");
    let pageValStr = getParam("page");

    const hasParams =
      kw !== null ||
      sk !== null ||
      isBoolParam !== null ||
      loc !== null ||
      pStatus !== null ||
      minExp !== null ||
      maxExp !== null ||
      dupsOnlyParam !== null ||
      pageValStr !== null;

    const storageKey = `admin_resume_db_filters_${pathname}`;

    if (!hasParams && typeof window !== "undefined") {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          kw = parsed.keyword || "";
          sk = parsed.skills || "";
          isBoolParam = parsed.isBooleanSearch ? "true" : "";
          loc = parsed.location || "";
          pStatus = parsed.parseStatus || "all";
          minExp = parsed.minExperience || "";
          maxExp = parsed.maxExperience || "";
          dupsOnlyParam = parsed.duplicatesOnly ? "true" : "";
          pageValStr = parsed.page ? String(parsed.page) : "1";

          const params = new URLSearchParams();
          if (pageValStr && pageValStr !== "1") params.set("page", pageValStr);
          if (kw?.trim()) params.set("keyword", kw.trim());
          if (sk?.trim()) params.set("skills", sk.trim());
          if (isBoolParam === "true") params.set("isBooleanSearch", "true");
          if (loc?.trim()) params.set("location", loc.trim());
          if (pStatus && pStatus !== "all") params.set("parseStatus", pStatus);
          if (minExp?.trim()) params.set("minExperience", minExp.trim());
          if (maxExp?.trim()) params.set("maxExperience", maxExp.trim());
          if (dupsOnlyParam === "true") params.set("duplicatesOnly", "true");
          const query = params.toString();
          if (query) {
            router.replace(`${pathname}?${query}`, { scroll: false });
          }
        } catch (_e) {}
      }
    }

    const finalKw = kw || "";
    const finalSk = sk || "";
    const finalIsBool = isBoolParam === "true" || isBooleanExpression(finalSk);
    const finalLoc = loc || "";
    const finalPStatus: ParseStatus = pStatus || "all";
    const finalMinExp = minExp || "";
    const finalMaxExp = maxExp || "";
    const finalDupsOnly = dupsOnlyParam === "true";
    const finalPage = parseInt(pageValStr || "1", 10);

    setKeyword(finalKw);
    setIsBooleanSearch(finalIsBool);
    if (finalIsBool) {
      setBooleanSkillsExpr(finalSk);
      setSkills([]);
    } else {
      setBooleanSkillsExpr("");
      setSkills(finalSk ? finalSk.split(",").map((s) => s.trim()).filter(Boolean) : []);
    }
    setLocation(finalLoc);
    setParseStatus(finalPStatus);
    setMinExperience(finalMinExp);
    setMaxExperience(finalMaxExp);
    setDuplicatesOnly(finalDupsOnly);
    setPage(finalPage);

    setAppliedKeyword(finalKw);
    setAppliedSkills(finalSk);
    setAppliedIsBooleanSearch(finalIsBool);
    setAppliedLocation(finalLoc);
    setAppliedParseStatus(finalPStatus);
    setAppliedMinExperience(finalMinExp);
    setAppliedMaxExperience(finalMaxExp);
    setAppliedDuplicatesOnly(finalDupsOnly);

    const isClean =
      !finalKw &&
      !finalSk &&
      !finalIsBool &&
      !finalLoc &&
      finalPStatus === "all" &&
      !finalMinExp &&
      !finalMaxExp &&
      !finalDupsOnly &&
      finalPage === 1;

    if (typeof window !== "undefined") {
      if (isClean) {
        try {
          sessionStorage.removeItem(storageKey);
        } catch (_e) {}
      } else {
        try {
          sessionStorage.setItem(
            storageKey,
            JSON.stringify({
              keyword: finalKw,
              skills: finalSk,
              isBooleanSearch: finalIsBool,
              location: finalLoc,
              parseStatus: finalPStatus,
              minExperience: finalMinExp,
              maxExperience: finalMaxExp,
              duplicatesOnly: finalDupsOnly,
              page: finalPage,
            })
          );
        } catch (_e) {}
      }
    }

    fetchResumes(
      finalPage,
      finalKw,
      finalSk,
      finalIsBool,
      finalLoc,
      finalPStatus,
      finalMinExp,
      finalMaxExp,
      finalDupsOnly
    );
  }, [searchParams, pathname, router, refreshCount, fetchResumes, getParam]);

  const onApplyFilters = () => {
    const formattedSkills = isBooleanSearch ? booleanSkillsExpr.trim() : skills.join(",");
    const hasInputs =
      keyword.trim().length > 0 ||
      formattedSkills.length > 0 ||
      location.trim().length > 0 ||
      (parseStatus && parseStatus !== "all") ||
      minExperience.trim().length > 0 ||
      maxExperience.trim().length > 0 ||
      duplicatesOnly;
    if (!hasInputs) {
      onClearFilters();
    } else {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(`admin_resume_db_filters_${pathname}`);
        } catch (_e) {}
      }
      updateUrl(
        1,
        keyword,
        formattedSkills,
        isBooleanSearch,
        location,
        parseStatus,
        minExperience,
        maxExperience,
        duplicatesOnly
      );
    }
  };

  const onClearFilters = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`admin_resume_db_filters_${pathname}`);
      } catch (_e) {}
    }

    setKeyword("");
    setSkills([]);
    setIsBooleanSearch(false);
    setBooleanSkillsExpr("");
    setLocation("");
    setParseStatus("all");
    setMinExperience("");
    setMaxExperience("");
    setDuplicatesOnly(false);
    setAppliedKeyword("");
    setAppliedSkills("");
    setAppliedIsBooleanSearch(false);
    setAppliedLocation("");
    setAppliedParseStatus("all");
    setAppliedMinExperience("");
    setAppliedMaxExperience("");
    setAppliedDuplicatesOnly(false);
    setSelectedIds([]);
    setPage(1);

    router.replace(pathname, { scroll: false });
    fetchResumes(1, "", "", false, "", "all", "", "", false);
  };

  // Map of potential duplicate resumes (matching email, phone, or name)
  const duplicateMap = useMemo(() => {
    const emailGroups = new Map<string, string[]>();
    const phoneGroups = new Map<string, string[]>();
    const nameGroups = new Map<string, string[]>();

    resumes.forEach((r) => {
      if (r.extractedEmail && r.extractedEmail.trim().length > 3) {
        const em = r.extractedEmail.trim().toLowerCase();
        emailGroups.set(em, [...(emailGroups.get(em) || []), r.id]);
      }
      if (r.extractedPhone && r.extractedPhone.trim().length >= 7) {
        const ph = r.extractedPhone.replace(/\D/g, "").slice(-10);
        if (ph.length >= 7) {
          phoneGroups.set(ph, [...(phoneGroups.get(ph) || []), r.id]);
        }
      }
      if (r.extractedName && r.extractedName.trim().length >= 3) {
        const nm = r.extractedName.trim().toLowerCase();
        nameGroups.set(nm, [...(nameGroups.get(nm) || []), r.id]);
      }
    });

    const map = new Map<string, { reason: string; matchingIds: string[] }>();
    resumes.forEach((r) => {
      const em = r.extractedEmail?.trim().toLowerCase();
      const ph = r.extractedPhone?.replace(/\D/g, "").slice(-10);
      const nm = r.extractedName?.trim().toLowerCase();

      const emGroup = em ? emailGroups.get(em) : null;
      const phGroup = ph ? phoneGroups.get(ph) : null;
      const nmGroup = nm ? nameGroups.get(nm) : null;

      if (emGroup && emGroup.length > 1) {
        map.set(r.id, { reason: `Email (${r.extractedEmail})`, matchingIds: emGroup });
      } else if (phGroup && phGroup.length > 1) {
        map.set(r.id, { reason: `Phone (${r.extractedPhone})`, matchingIds: phGroup });
      } else if (nmGroup && nmGroup.length > 1) {
        map.set(r.id, { reason: `Name (${r.extractedName})`, matchingIds: nmGroup });
      }
    });

    return map;
  }, [resumes]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOnPage = () => {
    const pageIds = resumes.map((r) => r.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const selectDuplicateGroup = (matchingIds: string[]) => {
    setSelectedIds((prev) => Array.from(new Set([...prev, ...matchingIds])));
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected resume${selectedIds.length !== 1 ? "s" : ""} from the database? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/resume-database", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      setMessage(`✅ ${data.message || `Successfully deleted ${selectedIds.length} resumes.`}`);
      setSelectedIds([]);
      setRefreshCount((prev) => prev + 1);
    } catch (err: any) {
      setMessage(`❌ ${err?.message || "Failed to delete selected resumes."}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open Merge Modal
  const handleOpenMergeModal = () => {
    if (selectedIds.length < 2) {
      alert("Please select at least 2 candidate resumes to merge duplicates.");
      return;
    }
    // Pick the most complete resume or the first selected as default primary
    const selectedResumes = resumes.filter((r) => selectedIds.includes(r.id));
    let bestPrimary = selectedIds[0];
    if (selectedResumes.length > 0) {
      // Pick one with parsed status and most skills
      const sorted = [...selectedResumes].sort((a, b) => {
        if (a.parseStatus === "PARSED" && b.parseStatus !== "PARSED") return -1;
        if (b.parseStatus === "PARSED" && a.parseStatus !== "PARSED") return 1;
        return (b.skills?.length || 0) - (a.skills?.length || 0);
      });
      bestPrimary = sorted[0].id;
    }
    setPrimaryMergeId(bestPrimary);
    setMergeModalOpen(true);
  };

  // Confirm Merge
  const handleConfirmMerge = async () => {
    if (selectedIds.length < 2 || !primaryMergeId) return;
    const duplicateIds = selectedIds.filter((id) => id !== primaryMergeId);
    if (duplicateIds.length === 0) return;

    setIsMerging(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/resume-database/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryId: primaryMergeId,
          duplicateIds,
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      const data = await res.json();
      setMessage(`✅ ${data.message || "Successfully merged duplicate resumes."}`);
      setMergeModalOpen(false);
      setSelectedIds([]);
      setRefreshCount((prev) => prev + 1);
    } catch (err: any) {
      setMessage(`❌ ${err?.message || "Failed to merge resumes."}`);
    } finally {
      setIsMerging(false);
    }
  };

  const onUpload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setMessage("");

    // Send files in client-side batches of 10 to avoid request body size limits
    const CLIENT_BATCH_SIZE = 10;
    const totalBatches = Math.ceil(files.length / CLIENT_BATCH_SIZE);
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalFiles = 0;
    const failedFilesList: Array<{ name: string; error: string }> = [];

    try {
      for (let i = 0; i < files.length; i += CLIENT_BATCH_SIZE) {
        const batchFiles = files.slice(i, i + CLIENT_BATCH_SIZE);
        const batchNum = Math.floor(i / CLIENT_BATCH_SIZE) + 1;
        setMessage(
          totalBatches > 1
            ? `Uploading batch ${batchNum}/${totalBatches} (files ${i + 1}–${Math.min(i + CLIENT_BATCH_SIZE, files.length)} of ${files.length})… please wait`
            : `Uploading ${files.length} file${files.length !== 1 ? "s" : ""}… please wait`
        );

        const formData = new FormData();
        batchFiles.forEach((file) => formData.append("files", file));
        const res = await fetch("/api/admin/resume-database/bulk-upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error(await readApiError(res));
        }
        const result = (await res.json()) as BulkUploadResult;
        totalFiles += result.totalFiles;
        totalSuccess += result.successCount;
        totalFailed += result.failedCount;

        if (result.createdDocs && Array.isArray(result.createdDocs)) {
          result.createdDocs.forEach((doc: any) => {
            if (doc.parseStatus === "FAILED") {
              failedFilesList.push({
                name: doc.originalFileName,
                error: doc.parseError || "Unknown error",
              });
            }
          });
        }
      }

      let msg = `✅ Done! Uploaded ${totalFiles} files: ${totalSuccess} parsed, ${totalFailed} failed.`;
      if (failedFilesList.length > 0) {
        msg += "\n\nFailed files:\n" + failedFilesList.map((f) => `• ${f.name}: ${f.error}`).join("\n");
      }
      setMessage(msg);
      setFiles([]);
      await fetchResumes(
        1,
        appliedKeyword,
        appliedSkills,
        appliedIsBooleanSearch,
        appliedLocation,
        appliedParseStatus,
        appliedMinExperience,
        appliedMaxExperience
      );
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleExportCSV = async (applyFilters: boolean) => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (applyFilters) {
        if (appliedKeyword.trim()) params.set("keyword", appliedKeyword.trim());
        if (appliedSkills.trim()) params.set("skills", appliedSkills.trim());
        if (appliedIsBooleanSearch) params.set("isBooleanSearch", "true");
        if (appliedLocation.trim()) params.set("location", appliedLocation.trim());
        if (appliedParseStatus !== "all") params.set("parseStatus", appliedParseStatus);
        if (appliedMinExperience.trim()) params.set("minExperience", appliedMinExperience.trim());
        if (appliedMaxExperience.trim()) params.set("maxExperience", appliedMaxExperience.trim());
      }

      const res = await fetch(`/api/admin/resume-database?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      const exportResumes: ResumeItem[] = data.resumes ?? [];

      if (exportResumes.length === 0) {
        alert("No resume records found to export.");
        return;
      }

      const headers = [
        "Candidate ID", "System ID", "Candidate Name", "Email Address", "Phone Number",
        "Current Job Title", "Experience (Years)", "Location", "Skills",
        "Parse Status", "Original File Name", "File Size", "Resume URL",
        "Uploaded Date", "Parse Error"
      ];

      const rows = exportResumes.map((doc, index) => [
        formatDisplayId(doc.id, "RES", index),
        doc.id,
        `"${(doc.extractedName || "").replace(/"/g, '""')}"`,
        `"${(doc.extractedEmail || "").replace(/"/g, '""')}"`,
        `"${formatPhoneForCsv(doc.extractedPhone).replace(/"/g, '""')}"`,
        `"${(doc.currentTitle || "").replace(/"/g, '""')}"`,
        doc.experienceYears ?? "",
        `"${(doc.extractedLocation || "").replace(/"/g, '""')}"`,
        `"${(doc.skills || []).join(", ").replace(/"/g, '""')}"`,
        doc.parseStatus,
        `"${(doc.originalFileName || "").replace(/"/g, '""')}"`,
        `"${formatBytes(doc.sizeBytes)}"`,
        `"${(doc.r2Url || "").replace(/"/g, '""')}"`,
        doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : "",
        `"${(doc.parseError || "").replace(/"/g, '""')}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      const filename = applyFilters
        ? `ai_scanned_resumes_filtered_${new Date().toISOString().split('T')[0]}.csv`
        : `ai_scanned_resumes_all_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export resumes:", err);
      alert("Failed to download resume database export.");
    } finally {
      setExporting(false);
    }
  };



  const onDeleteResume = async (id: string, fileName: string) => {
    if (loading || uploading) return;
    const confirmed = window.confirm(
      `Delete resume "${fileName}" from database? This action cannot be undone.`
    );
    if (!confirmed) return;

    setMessage("");
    try {
      const res = await fetch(`/api/admin/resume-database?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      setMessage(`Successfully deleted resume "${fileName}".`);
      setRefreshCount((prev) => prev + 1);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to delete resume."
      );
    }
  };

  const rangeText = useMemo(() => {
    if (total === 0) return "Showing 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}-${end} of ${total}`;
  }, [limit, page, total]);

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Admin Panel</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resume <span className="text-blue-600">Database</span></h1>
            <p className="text-sm font-medium text-slate-500">Bulk upload, parse, and search candidate resumes across the platform.</p>
          </div>

          {/* Export CSV actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting || loading}
              onClick={() => handleExportCSV(true)}
              className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 disabled:opacity-50 shadow-sm"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>{exporting ? "Downloading..." : `Download Filtered (${total})`}</span>
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
          </div>
        </div>

        {/* Upload Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="h-11 opacity-0 absolute inset-0 z-10 cursor-pointer w-full"
              />
              <div className="h-11 w-full flex items-center gap-3 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/40 hover:bg-blue-50 px-4 transition-all">
                <Upload className="h-4 w-4 text-blue-400 shrink-0" />
                <p className="text-xs font-semibold text-slate-500">
                  {files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""} selected` : "Click to select resumes (PDF, DOC, DOCX)"}
                </p>
              </div>
            </div>
            <Button
              onClick={onUpload}
              disabled={uploading || files.length === 0}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Upload className="mr-2 h-3.5 w-3.5 text-white" />
              <span className="text-white">{uploading ? "Uploading..." : "Upload & Parse"}</span>
            </Button>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium animate-in slide-in-from-top-2 whitespace-pre-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Upload Log</span>
              {message}
            </div>
          )}
        </div>

        {/* Filter Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Search Filters</span>
            <span className="ml-auto text-[11px] font-semibold text-slate-400 tabular-nums">{rangeText}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* Keyword */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, email, title..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skills</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    id="boolean-search-toggle"
                    checked={isBooleanSearch}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsBooleanSearch(checked);
                      if (checked && !booleanSkillsExpr && skills.length > 0) {
                        setBooleanSkillsExpr(skills.map(s => s.includes(" ") ? `"${s}"` : s).join(" AND "));
                      } else if (!checked && booleanSkillsExpr && skills.length === 0) {
                        const extracted = extractSearchTerms(booleanSkillsExpr);
                        if (extracted.length > 0) {
                          setSkills(extracted);
                        }
                      }
                    }}
                    className="h-3 w-3 rounded border-slate-300 text-blue-600 cursor-pointer"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Boolean</span>
                </label>
              </div>
              {isBooleanSearch ? (
                <input
                  type="text"
                  placeholder="java AND react OR laravel"
                  value={booleanSkillsExpr}
                  onChange={(e) => setBooleanSkillsExpr(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              ) : (
                <SkillTagInput
                  value={skills}
                  onChange={setSkills}
                  placeholder="React, Java, Python..."
                  className="w-full"
                />
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City, state, country..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Parse Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
              <Select value={parseStatus} onValueChange={(val) => setParseStatus(val as ParseStatus)}>
                <SelectTrigger className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:border-blue-500/50">
                  <SelectValue placeholder="All Resumes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resumes</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARSED">Parsed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Exp Range (Yrs)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all text-center"
                />
                <span className="text-slate-400 font-bold text-xs shrink-0">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxExperience}
                  onChange={(e) => setMaxExperience(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onApplyFilters()}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-500/50 focus:outline-none transition-all text-center"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={onApplyFilters}
                loading={loading}
                className="h-9 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <span className="text-white">Apply Filters</span>
              </Button>
              <Button
                variant="ghost"
                onClick={onClearFilters}
                loading={loading}
                className="h-9 px-5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                <span>Reset</span>
              </Button>
            </div>

            {/* Quick Duplicates Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nextVal = !duplicatesOnly;
                  setDuplicatesOnly(nextVal);
                  updateUrl(
                    1,
                    keyword,
                    isBooleanSearch ? booleanSkillsExpr : skills.join(","),
                    isBooleanSearch,
                    location,
                    parseStatus,
                    minExperience,
                    maxExperience,
                    nextVal
                  );
                }}
                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  duplicatesOnly
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{duplicatesOnly ? "Showing Duplicates Only" : "Filter Duplicates Only"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Toolbar & Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
          {/* Subheader Toolbar */}
          {!loading && resumes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-slate-50/70 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSelectAllOnPage}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {resumes.every((r) => selectedIds.includes(r.id)) ? (
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Square className="h-4 w-4 text-slate-400" />
                  )}
                  <span>Select All on Page ({resumes.length})</span>
                </button>

                {selectedIds.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    {selectedIds.length} Selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {duplicateMap.size > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    {duplicateMap.size} Potential Duplicate Resumes Detected
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-400">{rangeText}</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-blue-500 animate-pulse">Loading Resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No resumes found matching your filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or clearing filters.</p>
            </div>
          ) : (
            <div className="divide-y-0 flex flex-col gap-3 p-4">
              {resumes.map((resume, idx) => {
                const isSelected = selectedIds.includes(resume.id);
                const dupInfo = duplicateMap.get(resume.id);
                const statusStyles = {
                  PARSED: "bg-emerald-50 text-emerald-600 border-emerald-200",
                  FAILED: "bg-red-50 text-red-600 border-red-200",
                  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
                };

                return (
                  <div
                    key={resume.id}
                    className={`group flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl px-5 py-4.5 border transition-all animate-in fade-in duration-500 ${
                      isSelected
                        ? "bg-blue-50/30 border-blue-400 ring-2 ring-blue-500/10 shadow-sm"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* Checkbox */}
                    <div className="pt-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSelect(resume.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        aria-label={`Select resume ${resume.originalFileName}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                        ) : (
                          <Square className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* Middle: Identity & Metadata */}
                    <div className="flex-1 min-w-0 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {formatDisplayId(resume.id, "RES")}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {resume.extractedName || "Unknown Candidate"}
                        </h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusStyles[resume.parseStatus]}`}>
                          {resume.parseStatus === "PARSED" ? <CircleCheckBig className="h-3 w-3" /> : resume.parseStatus === "FAILED" ? <CircleX className="h-3 w-3" /> : null}
                          {resume.parseStatus}
                        </span>
                        {resume.currentTitle && (
                          <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                            {resume.currentTitle}
                          </span>
                        )}
                        {resume.experienceYears != null && (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {resume.experienceYears}Y Exp
                          </span>
                        )}

                        {/* Duplicate Alert Pill */}
                        {dupInfo && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span>Duplicate Profile ({dupInfo.reason})</span>
                            <button
                              type="button"
                              onClick={() => selectDuplicateGroup(dupInfo.matchingIds)}
                              className="ml-1 text-[9px] underline hover:text-amber-900 font-extrabold cursor-pointer"
                            >
                              + Select All ({dupInfo.matchingIds.length})
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <Mail className="h-3 w-3 text-slate-400" />{resume.extractedEmail || "N/A"}
                        </span>
                        {resume.extractedPhone && (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />{resume.extractedPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400" />{resume.extractedLocation || "N/A"}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                          <CalendarDays className="h-3 w-3" />{new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-[10px] font-semibold text-slate-400 truncate">
                        {resume.originalFileName} &middot; {formatBytes(resume.sizeBytes)}
                      </p>

                      {resume.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {resume.skills.slice(0, 10).map((skill) => {
                            const isMatched = appliedIsBooleanSearch || isBooleanExpression(appliedSkills)
                              ? extractSearchTerms(appliedSkills || booleanSkillsExpr).some((term) => matchSkill(skill, term))
                              : (appliedSkills || skills.join(","))
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                                  .some((term) => matchSkill(skill, term));
                            return (
                              <span
                                key={`${resume.id}-${skill}`}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                                  isMatched
                                    ? "bg-blue-600 text-white border-blue-500 font-bold"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                          {resume.skills.length > 10 && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-400">
                              +{resume.skills.length - 10}
                            </span>
                          )}
                        </div>
                      )}

                      {resume.parseStatus === "FAILED" && resume.parseError && (
                        <div className="mt-1 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[10px] font-semibold">
                          {resume.parseError}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                      <Link
                        href={resume.r2Url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={() => onDeleteResume(resume.id, resume.originalFileName)}
                        className="h-8 px-3 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 tabular-nums">{rangeText}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-all"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold text-slate-600 tabular-nums px-3">
                Page {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-all"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200">
                {selectedIds.length} resume{selectedIds.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Merge Button */}
            <Button
              size="sm"
              onClick={handleOpenMergeModal}
              disabled={selectedIds.length < 2 || isMerging || isBulkDeleting}
              className={`h-9 px-4 rounded-xl text-xs font-bold gap-2 transition-all ${
                selectedIds.length >= 2
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
              }`}
            >
              <GitMerge className="h-3.5 w-3.5" />
              <span>Merge Selected ({selectedIds.length})</span>
            </Button>

            {/* Bulk Delete Button */}
            <Button
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting || isMerging}
              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold gap-2 shadow-md shadow-red-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isBulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}</span>
            </Button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={deselectAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Deselect all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Merge Confirmation Modal */}
        {mergeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                    <GitMerge className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Merge Duplicate Resumes</h3>
                    <p className="text-xs text-slate-500">Combine {selectedIds.length} candidate profiles into a single unified record.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  How Deduplication Merge Works:
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  All unique skills, work experience years, and missing contact information from the duplicate records will be merged into the chosen <strong>Primary Profile</strong>. Duplicate resume files will be safely removed.
                </p>
              </div>

              {/* Choose Primary Resume */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Primary Record to Keep:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resumes
                    .filter((r) => selectedIds.includes(r.id))
                    .map((r) => {
                      const isPrimary = primaryMergeId === r.id;
                      return (
                        <div
                          key={r.id}
                          onClick={() => setPrimaryMergeId(r.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isPrimary
                              ? "bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/60"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="radio"
                              name="primaryResume"
                              checked={isPrimary}
                              onChange={() => setPrimaryMergeId(r.id)}
                              className="h-4 w-4 text-blue-600 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {r.extractedName || "Unknown Candidate"}
                                {r.currentTitle && <span className="font-normal text-slate-500 ml-1">({r.currentTitle})</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {r.extractedEmail || "No Email"} &middot; {r.skills?.length || 0} Skills &middot; {r.originalFileName}
                              </p>
                            </div>
                          </div>
                          {isPrimary && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                              Primary
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setMergeModalOpen(false)}
                  disabled={isMerging}
                  className="h-10 px-5 rounded-xl text-xs font-semibold border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmMerge}
                  disabled={isMerging || !primaryMergeId}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 gap-2"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  <span>{isMerging ? "Merging..." : "Confirm & Merge"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
