"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@prisma/client";
import { Power, PowerOff } from "lucide-react";

export default function JobApprovalActions({
  jobId,
  currentStatus,
  onSuccess,
}: {
  jobId: string;
  currentStatus: JobStatus;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (
    status: JobStatus,
    confirmMessage: string
  ) => {
    if (!confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
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
    <div className="flex gap-2">
      {currentStatus === "PENDING" && (
        <>
          <Button
            size="sm"
            onClick={() =>
              handleStatusChange("ACTIVE", "Are you sure you want to approve this job? It will be visible to job seekers.")
            }
            disabled={loading}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              handleStatusChange("INACTIVE", "Are you sure you want to reject this job? It will not be visible to job seekers.")
            }
            disabled={loading}
          >
            Reject
          </Button>
        </>
      )}
      {currentStatus === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleStatusChange("INACTIVE", "Are you sure you want to deactivate this job? It will no longer be visible in the jobs list for users.")
          }
          disabled={loading}
          className="rounded-lg border-amber-200 bg-amber-50/80 text-amber-700 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300"
        >
          <PowerOff className="h-3.5 w-3.5" />
          Deactivate
        </Button>
      )}
      {currentStatus === "INACTIVE" && (
        <Button
          size="sm"
          onClick={() =>
            handleStatusChange("ACTIVE", "Are you sure you want to activate this job? It will be visible to job seekers again.")
          }
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Power className="h-3.5 w-3.5" />
          Activate
        </Button>
      )}
    </div>
  );
}

