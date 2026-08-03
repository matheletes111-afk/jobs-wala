"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, ShieldAlert, Sparkles, Upload } from "lucide-react";

interface EmployerApprovalActionsProps {
  userId: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  resumeSearchEnabled: boolean;
  resumeUploadEnabled: boolean;
}

export default function EmployerApprovalActions({
  userId,
  approvalStatus,
  resumeSearchEnabled,
  resumeUploadEnabled,
}: EmployerApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (
    status: "APPROVED" | "REJECTED",
    confirmMessage: string
  ) => {
    let reason: string | null = null;
    if (status === "REJECTED") {
      reason = prompt("Please enter the reason for rejecting this employer profile:");
      if (reason === null) return; // Cancelled
      if (!reason.trim()) {
        alert("A rejection reason is required.");
        return;
      }
    } else {
      if (!confirm(confirmMessage)) return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          approvalStatus: status, 
          rejectionReason: reason || undefined 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResumeAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeSearchEnabled: !resumeSearchEnabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update resume database access");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating resume database access:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUploadAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUploadEnabled: !resumeUploadEnabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update resume database upload access");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating resume database upload access:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {approvalStatus !== "APPROVED" && (
        <Button
          type="button"
          onClick={() =>
            handleStatusChange(
              "APPROVED",
              "Are you sure you want to APPROVE this employer? They will gain full login rights and their default free plan will be activated."
            )
          }
          loading={loading}
          className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          {!loading && <Check className="h-4 w-4" />}
          Approve Employer
        </Button>
      )}

      {approvalStatus !== "REJECTED" && (
        <Button
          type="button"
          onClick={() =>
            handleStatusChange(
              "REJECTED",
              "Are you sure you want to REJECT this employer? They will be unable to access their account."
            )
          }
          loading={loading}
          className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          {!loading && <X className="h-4 w-4" />}
          Reject Employer
        </Button>
      )}

      {approvalStatus === "APPROVED" && (
        <>
          <Button
            type="button"
            onClick={toggleResumeAccess}
            loading={loading}
            className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
              resumeSearchEnabled
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10"
            }`}
          >
            {!loading && <Sparkles className="h-4 w-4" />}
            Resume DB: {resumeSearchEnabled ? "ENABLED" : "DISABLED"}
          </Button>

          <Button
            type="button"
            onClick={toggleUploadAccess}
            loading={loading}
            className={`h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
              resumeUploadEnabled
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                : "bg-white/5 border border-white/10 text-foreground hover:bg-white/10"
            }`}
          >
            {!loading && <Upload className="h-4 w-4" />}
            Resume Upload: {resumeUploadEnabled ? "ENABLED" : "DISABLED"}
          </Button>
        </>
      )}
    </div>
  );
}
