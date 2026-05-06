"use client";

import { useState, useCallback } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareJobButtonProps {
  jobId: string;
  jobTitle?: string;
  variant?: "outline" | "ghost";
  size?: "sm" | "default" | "icon";
  className?: string;
}

export default function ShareJobButton({
  jobId,
  jobTitle,
  variant = "ghost",
  size = "icon",
  className = "",
}: ShareJobButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/jobs/${jobId}` : "";
    if (!url) return;
    try {
      if (navigator.share && jobTitle) {
        await navigator.share({
          title: jobTitle,
          url,
          text: `Check out this job: ${jobTitle}`,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback: open in new tab for user to copy manually?
      }
    }
  }, [jobId, jobTitle]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      title={copied ? "Copied!" : "Share job link"}
      aria-label={copied ? "Link copied" : "Share job"}
    >
      <Share2 className={`h-4 w-4 ${copied ? "text-emerald-600" : ""}`} />
    </Button>
  );
}
