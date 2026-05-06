"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Wand2,
  ExternalLink,
  User,
  Globe,
  Loader2,
  Info,
  ChevronRight,
  UserCheck,
  Copy,
  Check,
  ArrowUp,
  Download,
  Share2,
  Code,
  Star,
  Trash2,
  Bookmark,
  List,
  MessageSquare,
  Mail,
  RefreshCw,
  FileText
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: Array<{ src: string; width: string; height: string }>;
    cse_image?: Array<{ src: string }>;
    metatags?: Array<{ "og:title"?: string; "og:description"?: string }>;
  };
}

interface SavedQuery {
  id: string;
  label: string;
  query: string;
  createdAt: string;
}

interface ActiveJob {
  id: string;
  title: string;
  description: string;
  status: string;
  location?: string;
  requiredSkills?: string[];
}

export default function XRaySearch() {
  const [prompt, setPrompt] = useState("");
  const [xrayQuery, setXrayQuery] = useState("");
  const [results, setResults] = useState<GoogleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [startIndex, setStartIndex] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState("0");
  const [searchTime, setSearchTime] = useState("0.0");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [localFilter, setLocalFilter] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copyQueryFeedback, setCopyQueryFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [copyJSONFeedback, setCopyJSONFeedback] = useState(false);
  const [sortBy, setSortBy] = useState<"none" | "score">("none");
  const [scoreThreshold, setScoreThreshold] = useState<number>(0);
  const [bulkCopyFeedback, setBulkCopyFeedback] = useState(false);
  const [contacted, setContacted] = useState<string[]>([]);
  const [region, setRegion] = useState("in");
  const [language, setLanguage] = useState("en");
  const [summaries, setSummaries] = useState<Record<string, { summary: string, score: number }>>({});
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<GoogleSearchResult[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [savingQuery, setSavingQuery] = useState(false);
  const [batchSummarizing, setBatchSummarizing] = useState(false);
  const [sessionInsightsCount, setSessionInsightsCount] = useState(0);
  const [importText, setImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [copyEmailsFeedback, setCopyEmailsFeedback] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showJobContext, setShowJobContext] = useState(false);
  const [refinements, setRefinements] = useState<string[]>([]);
  const [refining, setRefining] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState<string | null>(null);
  const [batchDrafting, setBatchDrafting] = useState(false);

  const regions = [
    { label: "India", value: "in" },
    { label: "United States", value: "us" },
    { label: "United Kingdom", value: "uk" },
    { label: "Canada", value: "ca" },
    { label: "Global", value: "" }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("xray_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved));

    const savedShortlist = localStorage.getItem("xray_shortlist");
    if (savedShortlist) setShortlist(JSON.parse(savedShortlist));

    const savedContacted = localStorage.getItem("xray_contacted");
    if (savedContacted) setContacted(JSON.parse(savedContacted));

    const savedSummaries = localStorage.getItem("xray_summaries");
    if (savedSummaries) setSummaries(JSON.parse(savedSummaries));

    const savedDrafts = localStorage.getItem("xray_drafts");
    if (savedDrafts) setDrafts(JSON.parse(savedDrafts));

    const savedNotes = localStorage.getItem("xray_notes");
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedSortBy = localStorage.getItem("xray_sort_by");
    if (savedSortBy) setSortBy(savedSortBy as "none" | "score");

    fetchSavedQueries();
    fetchActiveJobs();
  }, []);

  useEffect(() => {
    localStorage.setItem("xray_summaries", JSON.stringify(summaries));
  }, [summaries]);

  useEffect(() => {
    localStorage.setItem("xray_drafts", JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem("xray_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("xray_sort_by", sortBy);
  }, [sortBy]);

  const fetchActiveJobs = async () => {
    try {
      const res = await fetch("/api/employer/jobs?limit=50");
      const data = await res.json();
      if (data.jobs) {
        setActiveJobs(data.jobs.filter((j: ActiveJob) => j.status === "ACTIVE"));
      }
    } catch (err) {
      console.error("Failed to fetch active jobs", err);
    }
  };

  const handleJobSourcing = (jobId: string) => {
    const job = activeJobs.find(j => j.id === jobId);
    if (!job) return;

    setSelectedJobId(jobId);
    const location = typeof job.location === 'string' ? job.location : "";
    const skills = job.requiredSkills?.join(", ") || "";
    const jobPrompt = `Find candidates for ${job.title} role ${location ? `in ${location}` : ""} with expertise in ${skills || job.description.substring(0, 100)}`;
    setPrompt(jobPrompt);
  };

  const fetchSavedQueries = async () => {
    try {
      const res = await fetch("/api/employer/xray-search");
      const data = await res.json();
      if (data.queries) setSavedQueries(data.queries);
    } catch (err) {
      console.error("Failed to fetch saved queries", err);
    }
  };

  const handleSaveQuery = async () => {
    if (!xrayQuery.trim() || savingQuery) return;
    setSavingQuery(true);
    try {
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-query", query: xrayQuery }),
      });
      if (res.ok) fetchSavedQueries();
    } catch (err) {
      console.error("Failed to save query", err);
    } finally {
      setSavingQuery(false);
    }
  };

  const handleDeleteQuery = async (index: number) => {
    try {
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-query", index }),
      });
      if (res.ok) fetchSavedQueries();
    } catch (err) {
      console.error("Failed to delete query", err);
    }
  };

  const toggleContacted = (link: string) => {
    setContacted(prev => {
      const updated = prev.includes(link)
        ? prev.filter(l => l !== link)
        : [...prev, link];
      localStorage.setItem("xray_contacted", JSON.stringify(updated));
      return updated;
    });
  };

  const handleFindSimilar = (item: GoogleSearchResult) => {
    const name = item.pagemap?.metatags?.[0]?.["og:title"]
      ? item.pagemap.metatags[0]["og:title"].split('|')[0].split('-')[0].trim()
      : item.title.split('|')[0].split('-')[0].trim();

    // Extract key keywords from title and snippet, removing common filler words
    const keywords = (item.title + " " + item.snippet)
      .replace(/[|.,\-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3 && !["linkedin", "profile", "google", "search", "current", "present"].includes(word.toLowerCase()))
      .slice(0, 5)
      .join(" ");

    setPrompt(`Candidates similar to ${name} with expertise in ${keywords}`);
    handleExtract();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopySummary = (item: GoogleSearchResult) => {
    const name = item.pagemap?.metatags?.[0]?.["og:title"]
      ? item.pagemap.metatags[0]["og:title"].split('|')[0].split('-')[0].trim()
      : item.title.split('|')[0].split('-')[0].trim();

    const insight = summaries[item.link];
    const aiInsight = insight ? `\nMatch Score: ${insight.score}%\nAI Insight: ${insight.summary}` : "";
    const candidateNote = notes[item.link] ? `\nMy Notes: ${notes[item.link]}` : "";
    const text = `Candidate: ${name}\nProfile: ${item.link}\nSummary: ${item.snippet}${aiInsight}${candidateNote}`;

    navigator.clipboard.writeText(text);
  };

  const handleDraftEmail = async (item: GoogleSearchResult) => {
    if (drafting === item.link || drafts[item.link]) return;
    setDrafting(item.link);
    try {
      const selectedJob = activeJobs.find(j => j.id === selectedJobId);
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draft-email",
          candidate: item,
          jobTitle: selectedJob?.title,
          jobDescription: selectedJob?.description
        }),
      });
      const data = await res.json();
      if (data.draft) {
        setDrafts(prev => ({ ...prev, [item.link]: data.draft }));
        setSessionInsightsCount(prev => prev + 1); // Increment stats for AI usage
      }
    } catch (err) {
      console.error("Drafting Error:", err);
    } finally {
      setDrafting(null);
    }
  };

  const handleRefine = async () => {
    if (results.length === 0 || refining) return;
    setRefining(true);
    try {
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refine",
          query: xrayQuery,
          results: results.slice(0, 5)
        }),
      });
      const data = await res.json();
      if (data.suggestions) setRefinements(data.suggestions);
    } catch (err) {
      console.error("Refinement Error:", err);
    } finally {
      setRefining(false);
    }
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("xray_recent_searches", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem("xray_recent_searches");
  };

  const toggleShortlist = (item: GoogleSearchResult) => {
    setShortlist(prev => {
      const isShortlisted = prev.some(s => s.link === item.link);
      const updated = isShortlisted
        ? prev.filter(s => s.link !== item.link)
        : [...prev, item];
      localStorage.setItem("xray_shortlist", JSON.stringify(updated));
      return updated;
    });
  };

  const filteredResults = results
    .filter(item => {
      const searchStr = (item.title + item.snippet).toLowerCase();
      const matchesText = searchStr.includes(localFilter.toLowerCase());

      if (scoreThreshold > 0) {
        const score = summaries[item.link]?.score || 0;
        return matchesText && score >= scoreThreshold;
      }

      return matchesText;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        const scoreA = summaries[a.link]?.score || 0;
        const scoreB = summaries[b.link]?.score || 0;
        return scoreB - scoreA;
      }
      return 0;
    });

  const examples = [
    "React developer in Bangalore",
    "Senior DevOps engineer in Mumbai",
    "Python Django expert in Hyderabad",
    "Frontend lead in Delhi NCR",
    "Product Designer on Behance",
    "Go Backend engineer on GitHub"
  ];

  const platforms = [
    { label: "LinkedIn", value: "site:linkedin.com/in", icon: <User className="h-3 w-3" /> },
    { label: "GitHub", value: "site:github.com", icon: <Code className="h-3 w-3" /> },
    { label: "Behance", value: "site:behance.net", icon: <Globe className="h-3 w-3" /> },
    { label: "Dribbble", value: "site:dribbble.com", icon: <Globe className="h-3 w-3" /> },
    { label: "StackOverflow", value: "site:stackoverflow.com/users", icon: <Code className="h-3 w-3" /> }
  ];

  const modifiers = [
    { label: "With Email", value: '"@gmail.com" OR "@linkedin.com"' },
    { label: "Senior Only", value: '"Senior" OR "Lead" OR "Manager" OR "Principal"' },
    { label: "Contact Info", value: '"phone" OR "mobile" OR "cell" OR "contact"' },
    { label: "Recently Updated", value: '"2024" OR "2025"' },
    { label: "Remote Ready", value: '"Remote" OR "Work from home" OR "WFH"' },
    { label: "Open to Work", value: '"Open to work" OR "Seeking opportunities"' }
  ];

  const setPlatform = (site: string) => {
    setXrayQuery(prev => {
      // Remove any existing site: operator
      const cleaned = prev.replace(/site:[^\s]+/g, "").trim();
      return `${site} ${cleaned}`.trim();
    });
  };

  const handleExtract = async () => {
    if (!prompt.trim()) return;
    setExtracting(true);
    setError(null);
    setResults([]);
    setHasMore(false);
    setStartIndex(1);
    setTotalResults("0");
    try {
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", prompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setXrayQuery(data.query || "");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate X-Ray string";
      setError(errorMessage);
    } finally {
      setExtracting(false);
    }
  };

  const applyRefinement = (ref: string) => {
    if (!xrayQuery.includes(ref)) {
      setXrayQuery(prev => `${prev} ${ref}`);
      setRefinements(prev => prev.filter(r => r !== ref));
    }
  };

  const handleSearch = async (isLoadMore = false) => {
    if (!xrayQuery.trim()) return;
    setRefinements([]); // Clear old refinements on new search

    const newStartIndex = isLoadMore ? startIndex + 10 : 1;
    if (!isLoadMore) {
      setResults([]);
      setStartIndex(1);
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          query: xrayQuery,
          start: newStartIndex,
          gl: region
        }),
      });
      const data = await res.json();
      if (data.error) {
        const detailMsg = data.details?.error?.message || data.error;
        throw new Error(detailMsg);
      }

      const newResults = data.results || [];
      setResults(prev => isLoadMore ? [...prev, ...newResults] : newResults);
      setTotalResults(data.totalResults || "0");
      setSearchTime(data.searchTime || "0.0");
      setHasMore(newResults.length === 10);
      setStartIndex(newStartIndex);

      if (!isLoadMore && xrayQuery.trim()) {
        saveRecentSearch(xrayQuery);
        // Automatically suggest refinements after a successful new search
        if (newResults.length > 0) {
          setTimeout(() => handleRefine(), 1000);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch candidates from Google";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (link: string, index: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSummarize = async (link: string, title: string, snippet: string) => {
    if (summaries[link] || summarizing === link) return;
    setSummarizing(link);
    try {
      const selectedJob = activeJobs.find(j => j.id === selectedJobId);
      const res = await fetch("/api/employer/xray-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize",
          title,
          snippet,
          jobTitle: selectedJob?.title,
          jobDescription: selectedJob?.description
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSummaries(prev => ({
        ...prev,
        [link]: {
          summary: data.summary,
          score: data.score
        }
      }));
      setSessionInsightsCount(prev => prev + 1);
    } catch (err: unknown) {
      console.error("AI Summary Error:", err);
    } finally {
      setSummarizing(null);
    }
  };

  const handleBulkImport = () => {
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (lines.length === 0) return;

    const newItems: GoogleSearchResult[] = lines.map(link => ({
      title: link.split('/').pop() || "Imported Profile",
      link: link,
      snippet: "Manually imported link. Visit profile for details.",
      pagemap: {}
    }));

    setShortlist(prev => {
      const existingLinks = new Set(prev.map(s => s.link));
      const filtered = newItems.filter(item => !existingLinks.has(item.link));
      const updated = [...prev, ...filtered];
      localStorage.setItem("xray_shortlist", JSON.stringify(updated));
      return updated;
    });

    setImportText("");
    setIsImporting(false);
  };

  const handleBatchShortlist = () => {
    const newItems = filteredResults.filter(item => !shortlist.some(s => s.link === item.link));
    if (newItems.length === 0) return;

    setShortlist(prev => {
      const updated = [...prev, ...newItems];
      localStorage.setItem("xray_shortlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBatchContacted = () => {
    const visibleShortlist = shortlist.filter(item => {
      const searchStr = (item.title + item.snippet).toLowerCase();
      return searchStr.includes(localFilter.toLowerCase());
    });

    const newLinks = visibleShortlist
      .map(item => item.link)
      .filter(link => !contacted.includes(link));

    if (newLinks.length === 0) return;

    setContacted(prev => {
      const updated = [...prev, ...newLinks];
      localStorage.setItem("xray_contacted", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBulkRemoveContacted = () => {
    setShortlist(prev => {
      const updated = prev.filter(item => !contacted.includes(item.link));
      localStorage.setItem("xray_shortlist", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBatchSummarize = async () => {
    const toSummarize = filteredResults.filter(item => !summaries[item.link]);
    if (toSummarize.length === 0 || batchSummarizing) return;

    setBatchSummarizing(true);
    try {
      // Process in small batches of 3 to avoid overwhelming the API/UI
      const chunkSize = 3;
      for (let i = 0; i < toSummarize.length; i += chunkSize) {
        const chunk = toSummarize.slice(i, i + chunkSize);
        await Promise.all(chunk.map(item => handleSummarize(item.link, item.title, item.snippet)));
      }
    } catch (err) {
      console.error("Batch summarization failed", err);
    } finally {
      setBatchSummarizing(false);
    }
  };

  const handleBatchDraftOutreach = async () => {
    const toDraft = shortlist.filter(item => !drafts[item.link]);
    if (toDraft.length === 0 || batchDrafting) return;

    setBatchDrafting(true);
    try {
      // Outreach generation is token-heavy, process in small batches of 2
      const chunkSize = 2;
      for (let i = 0; i < toDraft.length; i += chunkSize) {
        const chunk = toDraft.slice(i, i + chunkSize);
        await Promise.all(chunk.map(item => handleDraftEmail(item)));
      }
    } catch (err) {
      console.error("Batch drafting failed", err);
    } finally {
      setBatchDrafting(false);
    }
  };

  const applyModifier = (mod: string) => {
    if (!xrayQuery.includes(mod)) {
      setXrayQuery(prev => `${prev} ${mod}`.trim());
    }
  };

  const handleSaveNote = (link: string, note: string) => {
    setNotes(prev => ({ ...prev, [link]: note }));
  };

  const handleClear = () => {
    setPrompt("");
    setXrayQuery("");
    setResults([]);
    setError(null);
    setStartIndex(1);
    setHasMore(false);
    setTotalResults("0");
    setSearchTime("0.0");
    setSummaries({});
    setDrafts({});
    setNotes({});
    localStorage.removeItem("xray_summaries");
    localStorage.removeItem("xray_drafts");
    localStorage.removeItem("xray_notes");
  };

  const copyXrayQuery = () => {
    if (!xrayQuery) return;
    navigator.clipboard.writeText(xrayQuery);
    setCopyQueryFeedback(true);
    setTimeout(() => setCopyQueryFeedback(false), 2000);
  };

  const shareResults = () => {
    if (results.length === 0) return;
    const summary = results.slice(0, 5).map(item => {
      const name = item.pagemap?.metatags?.[0]?.["og:title"]
        ? item.pagemap.metatags[0]["og:title"].split('|')[0].split('-')[0].trim()
        : item.title.split('|')[0].split('-')[0].trim();
      return `${name}: ${item.link}`;
    }).join('\n');

    const text = `Check out these candidates I found using X-Ray Search:\n\n${summary}\n\nTotal results: ${totalResults}`;
    navigator.clipboard.writeText(text);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const downloadCSV = (dataToExport: GoogleSearchResult[], filename: string) => {
    if (dataToExport.length === 0) return;

    const headers = ["Name", "Link", "Snippet", "Match Score", "AI Insight", "Status"];
    const rows = dataToExport.map(item => {
      const name = item.pagemap?.metatags?.[0]?.["og:title"]
        ? item.pagemap.metatags[0]["og:title"].split('|')[0].split('-')[0].trim()
        : item.title.split('|')[0].split('-')[0].trim();

      const insight = summaries[item.link];
      const status = contacted.includes(item.link) ? "Contacted" : "New";

      return [
        `"${name.replace(/"/g, '""')}"`,
        `"${item.link}"`,
        `"${item.snippet.replace(/"/g, '""')}"`,
        insight ? `"${insight.score}%"` : '""',
        insight ? `"${insight.summary.replace(/"/g, '""')}"` : '""',
        `"${status}"`
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyJSON = () => {
    if (results.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopyJSONFeedback(true);
    setTimeout(() => setCopyJSONFeedback(false), 2000);
  };

  const bulkCopyLinks = () => {
    if (filteredResults.length === 0) return;
    const links = filteredResults.map(item => item.link).join('\n');
    navigator.clipboard.writeText(links);
    setBulkCopyFeedback(true);
    setTimeout(() => setBulkCopyFeedback(false), 2000);
  };

  const extractEmails = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
  };

  const copyShortlistEmails = () => {
    const allEmails = shortlist.flatMap(item => extractEmails(item.snippet + " " + item.title));
    const uniqueEmails = Array.from(new Set(allEmails));

    if (uniqueEmails.length === 0) return;

    navigator.clipboard.writeText(uniqueEmails.join(', '));
    setCopyEmailsFeedback(true);
    setTimeout(() => setCopyEmailsFeedback(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white animate-in fade-in duration-1000">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-8 lg:px-10 lg:py-10">

        {/* Header Section */}
        <div className="mb-12 border-b border-white/5 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Global Talent Acquisition</p>
            </div>
            <h1 className="text-4xl font-black md:text-6xl tracking-tighter leading-tight text-white">
              X-Ray{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                Search
              </span>
            </h1>
            <p className="mt-4 text-lg font-medium text-muted-foreground/60 italic max-w-2xl">
              Find candidates directly from LinkedIn using natural language prompts and Google X-Ray search.
            </p>
          </div>

          {(prompt || xrayQuery || results.length > 0) && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all animate-in fade-in slide-in-from-right-4"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Stats Overview Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] flex flex-col gap-2 group hover:bg-blue-500/[0.03] transition-all">
            <div className="flex items-center gap-3 mb-1">
              <Search className="h-4 w-4 text-blue-500/50 group-hover:text-blue-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Candidates Found</p>
            </div>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {Number(totalResults).toLocaleString()}
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] flex flex-col gap-2 group hover:bg-amber-500/[0.03] transition-all">
            <div className="flex items-center gap-3 mb-1">
              <Star className="h-4 w-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Shortlisted</p>
            </div>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {shortlist.length}
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] flex flex-col gap-2 group hover:bg-indigo-500/[0.03] transition-all">
            <div className="flex items-center gap-3 mb-1">
              <Wand2 className="h-4 w-4 text-indigo-500/50 group-hover:text-indigo-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">AI Insights</p>
            </div>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {sessionInsightsCount}
            </p>
          </Card>
          <Card className="bg-white/[0.02] border-white/5 p-6 rounded-[2rem] flex flex-col gap-2 group hover:bg-emerald-500/[0.03] transition-all">
            <div className="flex items-center gap-3 mb-1">
              <List className="h-4 w-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Saved Queries</p>
            </div>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {savedQueries.length}
            </p>
          </Card>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Controls Sidebar */}
          <aside className="w-full shrink-0 lg:w-96">
            <div className="sticky top-32 space-y-6">

              {/* Step 1: Extraction */}
              <div className="rounded-[2.5rem] p-8 bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-black">1</div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Extract Keywords</h2>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] font-black uppercase tracking-tighter">
                    AI Powered
                  </Badge>
                </div>

                <div className="space-y-4">
                  {activeJobs.length > 0 && (
                    <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-left-2">
                      <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest italic">
                        Select an Active Job to Source
                      </p>
                      <select
                        value={selectedJobId || ""}
                        onChange={(e) => handleJobSourcing(e.target.value)}
                        className="w-full h-12 bg-blue-500/5 border border-blue-500/20 rounded-2xl px-4 text-xs font-bold text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-black">-- Pick a job to auto-generate prompt --</option>
                        {activeJobs.map(job => (
                          <option key={job.id} value={job.id} className="bg-black">
                            {job.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedJobId && (
                    <div className="mb-4 animate-in fade-in zoom-in duration-500">
                      <Button
                        variant="ghost"
                        onClick={() => setShowJobContext(!showJobContext)}
                        className="w-full h-10 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/10"
                      >
                        {showJobContext ? "Hide Job Details" : "View Job Context"}
                      </Button>
                      {showJobContext && (
                        <div className="mt-3 p-4 rounded-2xl bg-blue-500/[0.02] border border-blue-500/10 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest mb-2 italic">Active Requirements</p>
                          <p className="text-[10px] leading-relaxed text-muted-foreground/80 line-clamp-4">
                            {activeJobs.find(j => j.id === selectedJobId)?.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                    What are you looking for?
                  </p>
                  <div className="relative">
                    <Input
                      placeholder="e.g. React dev in Bangalore"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-sm font-medium pr-12 focus-visible:ring-blue-500/50"
                    />
                    <button
                      onClick={handleExtract}
                      disabled={extracting || !prompt}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-all"
                    >
                      {extracting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-muted-foreground/40 italic">
                    Our AI will convert your prompt into a LinkedIn-specific search string.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(ex)}
                        className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 transition-all border border-white/5"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>

                  {recentSearches.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                          Recent History
                        </p>
                        <button
                          onClick={clearHistory}
                          className="text-[8px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-2">
                        {recentSearches.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => setXrayQuery(q)}
                            className="w-full text-left text-[9px] font-medium text-blue-400 hover:text-blue-300 transition-colors line-clamp-1 truncate"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {savedQueries.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic text-amber-500/60">
                          Saved Queries
                        </p>
                      </div>
                      <div className="space-y-3">
                        {savedQueries.map((item, i) => (
                          <div key={i} className="flex items-center justify-between group/saved">
                            <button
                              onClick={() => setXrayQuery(item.query)}
                              className="flex-1 text-left text-[9px] font-bold text-foreground/80 hover:text-blue-400 transition-colors line-clamp-1 truncate"
                            >
                              {item.label}
                            </button>
                            <button
                              onClick={() => handleDeleteQuery(i)}
                              className="p-1 text-muted-foreground/20 hover:text-red-500 transition-all opacity-0 group-hover/saved:opacity-100"
                              title="Delete saved query"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Search Query */}
              <div className="rounded-[2.5rem] p-8 bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 text-[10px] font-black">2</div>
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">X-Ray Search String</h2>
                  </div>
                  <div className="flex gap-1.5">
                    {regions.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setRegion(r.value)}
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all ${region === r.value
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                        title={`Search in ${r.label}`}
                      >
                        {r.value || "GL"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {platforms.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => setPlatform(p.value)}
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${xrayQuery.includes(p.value)
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                          }`}
                      >
                        {p.icon}
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative group">
                    <textarea
                      value={xrayQuery}
                      onChange={(e) => setXrayQuery(e.target.value)}
                      placeholder='site:linkedin.com/in "React" "Bangalore"'
                      className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono text-blue-400 resize-none focus:outline-none focus:border-blue-500/50"
                    />
                    <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={copyXrayQuery}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-blue-400 transition-all"
                        title="Copy search string"
                      >
                        {copyQueryFeedback ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={handleSaveQuery}
                        disabled={savingQuery || !xrayQuery}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-amber-500 transition-all disabled:opacity-30"
                        title="Save to profile"
                      >
                        {savingQuery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Smart Refinement Suggestions */}
                  {results.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-3 w-3 text-indigo-400" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400/80">AI Smart Refinement</p>
                        </div>
                        {refining ? (
                          <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />
                        ) : (
                          <button
                            onClick={handleRefine}
                            className="text-[8px] font-black uppercase tracking-widest text-indigo-400/60 hover:text-indigo-400 transition-colors"
                            title="Refresh suggestions"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {refinements.map((ref, i) => (
                          <button
                            key={i}
                            onClick={() => applyRefinement(ref)}
                            className="text-[9px] font-bold px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all animate-in zoom-in duration-300"
                          >
                            + {ref}
                          </button>
                        ))}
                        {!refining && refinements.length === 0 && (
                          <button
                            onClick={handleRefine}
                            className="text-[9px] text-muted-foreground/40 italic hover:text-indigo-400 transition-colors"
                          >
                            Analyzing results... Click to generate suggestions.
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {modifiers.map((mod, i) => (
                      <button
                        key={i}
                        onClick={() => applyModifier(mod.value)}
                        className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 transition-all border border-white/5"
                      >
                        + {mod.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleSearch(false)}
                      disabled={loading || !xrayQuery}
                      className="flex-1 h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Execute Global Search
                    </Button>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(xrayQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-blue-400 transition-all ${!xrayQuery ? 'pointer-events-none opacity-50' : ''}`}
                      title="Open directly in Google"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 animate-in fade-in slide-in-from-top-2">
                  <Info className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-[10px] font-medium text-red-400">{error}</p>
                </div>
              )}

              {/* Tips Section */}
              <div className="rounded-[2.5rem] p-8 bg-blue-500/5 border border-blue-500/10 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <Info className="h-4 w-4 text-blue-500" />
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Search Tips</h2>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed italic">
                      Use quotes for exact matches: <code className="text-blue-400 not-italic">&quot;React Developer&quot;</code>
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed italic">
                      Add locations for better accuracy: <code className="text-blue-400 not-italic">&quot;Bangalore&quot;</code> or <code className="text-blue-400 not-italic">&quot;Remote&quot;</code>
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed italic">
                      AI handles synonyms automatically, but being specific helps.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* Results/Shortlist Section */}
          <div className="flex-1 min-w-0">
            <Tabs defaultValue="results" className="w-full">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-2">
                <TabsList className="bg-transparent h-auto p-0 gap-8">
                  <TabsTrigger
                    value="results"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-blue-500 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none bg-transparent px-0 pb-4 h-auto text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Search Results
                    {results.length > 0 && (
                      <Badge className="ml-2 bg-blue-500/10 text-blue-500 border-none text-[8px]">
                        {results.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="shortlist"
                    className="data-[state=active]:bg-transparent data-[state=active]:text-amber-500 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none bg-transparent px-0 pb-4 h-auto text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Shortlisted
                    {shortlist.length > 0 && (
                      <Badge className="ml-2 bg-amber-500/10 text-amber-500 border-none text-[8px]">
                        {shortlist.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {results.length > 0 && (
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="relative w-48 lg:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500/50" />
                      <Input
                        placeholder="Filter candidates..."
                        value={localFilter}
                        onChange={(e) => setLocalFilter(e.target.value)}
                        className="h-9 pl-9 bg-white/5 border-white/10 rounded-xl text-[10px] font-medium focus-visible:ring-blue-500/50"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyJSON}
                      className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-blue-400 shrink-0"
                      title="Copy Results as JSON"
                    >
                      {copyJSONFeedback ? <Check className="h-4 w-4 text-emerald-500" /> : <Code className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => downloadCSV(results, "xray-search-results")}
                      className="h-9 w-9 rounded-xl bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-blue-400 shrink-0"
                      title="Download CSV"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="results" className="mt-0 border-none p-0">
                {loading ? (
                  <div className="rounded-[3rem] p-32 text-center bg-white/[0.02] border border-white/5 border-dashed">
                    <div className="inline-block p-4 rounded-full bg-blue-500/10 mb-6">
                      <Globe className="h-8 w-8 text-blue-500 animate-pulse" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.5em] text-blue-500">Searching the Web...</p>
                    <p className="mt-2 text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Accessing Google Custom Search API</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="rounded-[3rem] p-32 text-center bg-white/[0.02] border border-white/5 border-dashed">
                    <div className="inline-block p-4 rounded-full bg-white/5 mb-6">
                      <Search className="h-8 w-8 text-muted-foreground/20" />
                    </div>
                    <p className="text-xl font-black text-muted-foreground/20 uppercase tracking-widest italic leading-relaxed">
                      No global results to display. <br />Generate a query to start searching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 pb-4 border-b border-white/5">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">
                          {localFilter ? `${filteredResults.length.toLocaleString()} / ` : ""}{Number(totalResults).toLocaleString()} Candidates Discovered
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 h-9">
                          <Star className={`h-3 w-3 mr-2 ${scoreThreshold > 0 ? "text-amber-500" : "text-muted-foreground/30"}`} />
                          <select
                            value={scoreThreshold}
                            onChange={(e) => setScoreThreshold(Number(e.target.value))}
                            className="bg-transparent text-[9px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none cursor-pointer"
                          >
                            <option value="0" className="bg-black">All Scores</option>
                            <option value="50" className="bg-black">50% +</option>
                            <option value="70" className="bg-black">70% +</option>
                            <option value="80" className="bg-black">80% +</option>
                            <option value="90" className="bg-black">90% +</option>
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSortBy(sortBy === "score" ? "none" : "score")}
                          className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === "score"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                          <ArrowUp className={`mr-2 h-3.5 w-3.5 transition-transform ${sortBy === "score" ? "" : "opacity-20"}`} />
                          Sort by Match
                        </Button>
                        {filteredResults.some(item => !shortlist.some(s => s.link === item.link)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchShortlist}
                            className="h-9 px-4 rounded-xl bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Star className="mr-2 h-3.5 w-3.5" />
                            Shortlist All
                          </Button>
                        )}
                        {filteredResults.some(item => !summaries[item.link]) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchSummarize}
                            disabled={batchSummarizing || loading}
                            className="h-9 px-4 rounded-xl bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            {batchSummarizing ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="mr-2 h-3.5 w-3.5" />
                            )}
                            Batch AI Insight
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={bulkCopyLinks}
                          className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-blue-400 shrink-0"
                          title="Bulk copy all links"
                        >
                          {bulkCopyFeedback ? <Check className="h-4 w-4 text-emerald-500" /> : <List className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {filteredResults.length === 0 && results.length > 0 ? (
                        <div className="p-20 text-center rounded-[2.5rem] bg-white/[0.02] border border-white/5 border-dashed">
                          <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest italic mb-6">
                            No results match your local filter.
                          </p>
                          <Button
                            variant="ghost"
                            onClick={() => setLocalFilter("")}
                            className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest"
                          >
                            Reset Local Filter
                          </Button>
                        </div>
                      ) : (
                        filteredResults.map((item, idx) => (
                          <CandidateCard
                            key={idx}
                            item={item}
                            idx={idx}
                            summaries={summaries}
                            summarizing={summarizing}
                            onSummarize={handleSummarize}
                            onCopy={handleCopy}
                            copiedIndex={copiedIndex}
                            isShortlisted={shortlist.some(s => s.link === item.link)}
                            onToggleShortlist={() => toggleShortlist(item)}
                            isContacted={contacted.includes(item.link)}
                            onToggleContacted={() => toggleContacted(item.link)}
                            onFindSimilar={() => handleFindSimilar(item)}
                            onCopySummary={() => handleCopySummary(item)}
                            draft={drafts[item.link] || null}
                            isDrafting={drafting === item.link}
                            onDraftEmail={handleDraftEmail}
                            note={notes[item.link] || ""}
                            onSaveNote={(note) => handleSaveNote(item.link, note)}
                          />
                        ))
                      )}
                    </div>

                    {hasMore && (
                      <div className="mt-12 flex justify-center">
                        <Button
                          onClick={() => handleSearch(true)}
                          disabled={loading}
                          variant="ghost"
                          className="h-14 px-12 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all group"
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="mr-2 h-4 w-4 text-blue-500 group-hover:animate-pulse" />
                          )}
                          Discover More Candidates
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shortlist" className="mt-0 border-none p-0">
                {shortlist.length === 0 ? (
                  <div className="rounded-[3rem] p-32 text-center bg-white/[0.02] border border-white/5 border-dashed">
                    <div className="inline-block p-4 rounded-full bg-amber-500/5 mb-6">
                      <Star className="h-8 w-8 text-amber-500/20" />
                    </div>
                    <p className="text-xl font-black text-muted-foreground/20 uppercase tracking-widest italic leading-relaxed">
                      Your shortlist is empty. <br />Star candidates to save them here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 pb-4 border-b border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                        {shortlist.length} Candidates Shortlisted
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 h-8">
                          <Star className={`h-2.5 w-2.5 mr-1.5 ${scoreThreshold > 0 ? "text-amber-500" : "text-muted-foreground/30"}`} />
                          <select
                            value={scoreThreshold}
                            onChange={(e) => setScoreThreshold(Number(e.target.value))}
                            className="bg-transparent text-[8px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none cursor-pointer"
                          >
                            <option value="0" className="bg-black">All</option>
                            <option value="50" className="bg-black">50%+</option>
                            <option value="80" className="bg-black">80%+</option>
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSortBy(sortBy === "score" ? "none" : "score")}
                          className={`h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === "score"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "text-muted-foreground hover:bg-white/5"
                            }`}
                        >
                          <ArrowUp className={`mr-2 h-3 w-3 transition-transform ${sortBy === "score" ? "" : "opacity-20"}`} />
                          Sort by Match
                        </Button>
                        {shortlist.length > 0 && shortlist.some(item => !contacted.includes(item.link)) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchContacted}
                            className="h-8 px-4 rounded-xl bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            <UserCheck className="mr-2 h-3 w-3" />
                            Mark All Contacted
                          </Button>
                        )}
                        {shortlist.length > 0 && shortlist.some(item => !summaries[item.link]) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchSummarize}
                            disabled={batchSummarizing}
                            className="h-8 px-4 rounded-xl bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            {batchSummarizing ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="mr-2 h-3 w-3" />
                            )}
                            Analyze All
                          </Button>
                        )}
                        {shortlist.length > 0 && shortlist.some(item => !drafts[item.link]) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBatchDraftOutreach}
                            disabled={batchDrafting}
                            className="h-8 px-4 rounded-xl bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            {batchDrafting ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Mail className="mr-2 h-3 w-3" />
                            )}
                            Draft All
                          </Button>
                        )}
                        {shortlist.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyShortlistEmails}
                            className={`h-8 px-4 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest ${copyEmailsFeedback
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-blue-400"
                              }`}
                          >
                            {copyEmailsFeedback ? <Check className="h-3 w-3 mr-2" /> : <Mail className="h-3 w-3 mr-2" />}
                            Copy Emails
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadCSV(shortlist, "xray-shortlist")}
                          className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-amber-500 shrink-0"
                          title="Download Shortlist CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsImporting(!isImporting)}
                          className="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/5 rounded-xl transition-all"
                        >
                          <Download className="h-3 w-3 mr-2 rotate-180" />
                          Import
                        </Button>
                        {shortlist.some(item => contacted.includes(item.link)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBulkRemoveContacted}
                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/5 rounded-xl transition-all"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Remove Contacted
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShortlist([]);
                            localStorage.removeItem("xray_shortlist");
                          }}
                          className="h-8 px-4 text-[9px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {isImporting && (
                      <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-blue-500/20 border-dashed animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic mb-4">
                          Paste LinkedIn/GitHub URLs (one per line)
                        </p>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-blue-400 mb-4 focus:outline-none focus:border-blue-500/50"
                          placeholder="https://www.linkedin.com/in/username"
                        />
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => setIsImporting(false)}
                            className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleBulkImport}
                            disabled={!importText.trim()}
                            className="h-10 px-8 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest"
                          >
                            Add to Shortlist
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4">
                      {shortlist
                        .filter(item => {
                          const searchStr = (item.title + item.snippet).toLowerCase();
                          const matchesText = searchStr.includes(localFilter.toLowerCase());

                          if (scoreThreshold > 0) {
                            const score = summaries[item.link]?.score || 0;
                            return matchesText && score >= scoreThreshold;
                          }

                          return matchesText;
                        })
                        .sort((a, b) => {
                          if (sortBy === "score") {
                            const scoreA = summaries[a.link]?.score || 0;
                            const scoreB = summaries[b.link]?.score || 0;
                            return scoreB - scoreA;
                          }
                          return 0;
                        })
                        .map((item, idx) => (
                          <CandidateCard
                            key={idx}
                            item={item}
                            idx={idx}
                            summaries={summaries}
                            summarizing={summarizing}
                            onSummarize={handleSummarize}
                            onCopy={handleCopy}
                            copiedIndex={copiedIndex}
                            isShortlisted={true}
                            onToggleShortlist={() => toggleShortlist(item)}
                            isContacted={contacted.includes(item.link)}
                            onToggleContacted={() => toggleContacted(item.link)}
                            onFindSimilar={() => handleFindSimilar(item)}
                            onCopySummary={() => handleCopySummary(item)}
                            draft={drafts[item.link] || null}
                            isDrafting={drafting === item.link}
                            onDraftEmail={handleDraftEmail}
                            note={notes[item.link] || ""}
                            onSaveNote={(note) => handleSaveNote(item.link, note)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-in fade-in zoom-in"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

interface CandidateCardProps {
  item: GoogleSearchResult;
  idx: number;
  summaries: Record<string, { summary: string, score: number }>;
  summarizing: string | null;
  onSummarize: (link: string, title: string, snippet: string) => void;
  onCopy: (link: string, index: number) => void;
  copiedIndex: number | null;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  isContacted: boolean;
  onToggleContacted: () => void;
  onFindSimilar: () => void;
  onCopySummary: () => void;
  draft: string | null;
  isDrafting: boolean;
  onDraftEmail: (item: GoogleSearchResult) => void;
  note: string;
  onSaveNote: (note: string) => void;
}

function CandidateCard({
  item,
  idx,
  summaries,
  summarizing,
  onSummarize,
  onCopy,
  copiedIndex,
  isShortlisted,
  onToggleShortlist,
  isContacted,
  onToggleContacted,
  onFindSimilar,
  onCopySummary,
  draft,
  isDrafting,
  onDraftEmail,
  note,
  onSaveNote,
}: CandidateCardProps) {
  const [showDraft, setShowDraft] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [tempNote, setTempNote] = useState(note);
  const [copiedDraft, setCopiedDraft] = useState(false);

  useEffect(() => {
    setTempNote(note);
  }, [note]);

  const handleNoteBlur = () => {
    if (tempNote !== note) {
      onSaveNote(tempNote);
    }
  };

  const name = item.pagemap?.metatags?.[0]?.["og:title"]
    ? item.pagemap.metatags[0]["og:title"].split('|')[0].split('-')[0].trim()
    : item.title.split('|')[0].split('-')[0].trim();

  const handleCopyDraft = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const insight = summaries[item.link];

  const borderColor = insight
    ? (insight.score >= 80 ? "border-emerald-500/30 group-hover:border-emerald-500/50" :
      insight.score >= 50 ? "border-amber-500/30 group-hover:border-amber-500/50" :
        "border-red-500/30 group-hover:border-red-500/50")
    : (isContacted ? "border-emerald-500/10" : "border-white/5 group-hover:border-white/10");

  const bgColor = insight
    ? (insight.score >= 80 ? "bg-emerald-500/[0.01] hover:bg-emerald-500/[0.03]" :
      insight.score >= 50 ? "bg-amber-500/[0.01] hover:bg-amber-500/[0.03]" :
        "bg-red-500/[0.01] hover:bg-red-500/[0.03]")
    : (isContacted ? "bg-emerald-500/[0.01]" : "bg-white/[0.02] hover:bg-white/[0.04]");

  return (
    <div
      className={`group relative flex flex-col gap-6 p-6 rounded-[2.5rem] border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 ${borderColor} ${bgColor} ${isContacted ? "grayscale-[0.5]" : ""}`}
      style={{ animationDelay: `${idx * 100}ms` }}
    >
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="shrink-0 flex flex-col items-center gap-4">
          {item.pagemap?.cse_thumbnail?.[0] ? (
            <div className="h-16 w-16 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shadow-2xl relative">
              <img
                src={item.pagemap.cse_thumbnail[0].src}
                alt=""
                className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              {isContacted && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shadow-2xl relative">
              <User className="h-8 w-8 text-white/10" />
              {isContacted && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center rounded-2xl">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={onToggleShortlist}
              className={`p-2.5 rounded-xl border transition-all ${isShortlisted
                ? "bg-amber-500/20 border-amber-500/40 text-amber-500"
                : "bg-white/5 border-white/10 text-muted-foreground hover:border-amber-500/40 hover:text-amber-500"
                }`}
              title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
            >
              <Star className={`h-4 w-4 ${isShortlisted ? "fill-amber-500" : ""}`} />
            </button>
            <button
              onClick={onToggleContacted}
              className={`p-2.5 rounded-xl border transition-all ${isContacted
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-500"
                : "bg-white/5 border-white/10 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500"
                }`}
              title={isContacted ? "Mark as uncontacted" : "Mark as contacted"}
            >
              <UserCheck className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-blue-400 transition-colors">
                {name}
              </h3>
              <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/10 text-[9px] font-black uppercase tracking-widest">
                LinkedIn
              </Badge>
              {isContacted && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase tracking-tighter">
                  Contacted
                </Badge>
              )}
              {insight && (
                <Badge className={`${insight.score >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  insight.score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  } text-[9px] font-black uppercase tracking-widest px-2`}>
                  {insight.score}% Match
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onFindSimilar}
                className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-400"
              >
                <Search className="h-3 w-3 mr-1.5" />
                Find Similar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopySummary}
                className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-foreground"
              >
                <Share2 className="h-3 w-3 mr-1.5" />
                Copy Info
              </Button>
            </div>
          </div>

          <p className="text-xs font-bold text-muted-foreground/40 mb-3 truncate italic opacity-60 group-hover:opacity-100 transition-opacity">
            {item.link}
          </p>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-4 group-hover:bg-white/[0.07] transition-colors relative">
            <p className="text-[11px] leading-relaxed text-muted-foreground/80 font-medium line-clamp-2">
              {item.snippet}
            </p>
            {insight && (
              <div className="mt-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-1">
                <p className="text-[10px] font-bold text-blue-400 italic">
                  AI Insight: <span className="text-muted-foreground font-medium">{insight.summary}</span>
                </p>
              </div>
            )}
            <button
              onClick={() => onSummarize(item.link, item.title, item.snippet)}
              disabled={summarizing === item.link || !!insight}
              className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-all shadow-lg"
              title="Get AI Recruiter Insight"
            >
              {summarizing === item.link ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : insight ? (
                <UserCheck className="h-3 w-3" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                <Globe className="h-3 w-3" />
                External Talent
              </span>
              <button
                onClick={() => onCopy(item.link, idx)}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 hover:text-blue-400 transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isShortlisted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  className={`h-9 w-9 p-0 rounded-xl transition-all ${note
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                    : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-amber-500"
                    }`}
                  title="Add candidate notes"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (draft) setShowDraft(!showDraft);
                  else onDraftEmail(item);
                }}
                disabled={isDrafting}
                className={`h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${draft
                  ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-indigo-400"
                  }`}
              >
                {isDrafting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : draft ? (
                  <MessageSquare className="h-3.5 w-3.5 mr-2" />
                ) : (
                  <Mail className="h-3.5 w-3.5 mr-2" />
                )}
                {draft ? (showDraft ? "Hide Message" : "View Message") : "Draft Outreach"}
              </Button>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 transition-all group/btn"
              >
                View Profile
                <ExternalLink className="h-3 w-3 text-blue-500 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Section */}
      {(showDraft || isDrafting) && draft && (
        <div className="mt-4 p-6 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Mail className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Personalized Outreach</p>
                <p className="text-[9px] text-muted-foreground/40 italic">AI-Generated based on profile & job requirements</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyDraft}
                className="h-8 px-3 rounded-lg bg-indigo-500/10 text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/20"
              >
                {copiedDraft ? (
                  <>
                    <Check className="h-3 w-3 mr-1.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1.5" />
                    Copy Text
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDraftEmail(item)}
                className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                title="Regenerate message"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="relative group/draft">
            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-full group-hover/draft:bg-indigo-500/40 transition-colors" />
            <p className="text-xs font-medium leading-relaxed text-indigo-200/80 whitespace-pre-wrap italic pl-4">
              {draft}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none text-[8px] font-black uppercase tracking-tighter">
              Ready to send
            </Badge>
            <p className="text-[8px] text-muted-foreground/30 font-bold uppercase tracking-widest">
              Double-check for accuracy before sending
            </p>
          </div>
        </div>
      )}

      {/* Notes Section */}
      {showNotes && isShortlisted && (
        <div className="mt-4 p-6 rounded-[2rem] bg-amber-500/[0.03] border border-amber-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <FileText className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Recruiter Notes</p>
              <p className="text-[9px] text-muted-foreground/40 italic">Internal notes for this candidate</p>
            </div>
          </div>
          <textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Add a note (e.g. 'Highly technical, strong React experience'...)"
            className="w-full min-h-[80px] bg-black/20 border border-amber-500/10 rounded-2xl p-4 text-xs font-medium text-amber-100/80 placeholder:text-amber-500/20 resize-none focus:outline-none focus:border-amber-500/30 transition-all"
          />
        </div>
      )}
    </div>
  );
}