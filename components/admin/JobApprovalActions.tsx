"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JobStatus } from "@prisma/client";

export default function JobApprovalActions({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: JobStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: JobStatus) => {
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
            onClick={() => handleStatusChange("ACTIVE")}
            disabled={loading}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleStatusChange("INACTIVE")}
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
          onClick={() => handleStatusChange("INACTIVE")}
          disabled={loading}
        >
          Deactivate
        </Button>
      )}
    </div>
  );
}

