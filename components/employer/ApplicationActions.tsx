"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function ApplicationActions({
  applicationId,
  currentStatus,
  onSuccess,
}: {
  applicationId: string;
  currentStatus: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={loading}
    >
      <SelectTrigger className="w-36 h-10 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 transition-all focus:ring-primary/20">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Saving...
          </span>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="REVIEWED">Reviewed</SelectItem>
        <SelectItem value="SHORTLISTED">Shortlist</SelectItem>
        <SelectItem value="REJECTED">Reject</SelectItem>
      </SelectContent>
    </Select>
  );
}

