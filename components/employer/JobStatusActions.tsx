"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, PauseCircle, PlayCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type JobStatus = "ACTIVE" | "PAUSED" | "CLOSED" | "PENDING" | "INACTIVE";

interface JobStatusActionsProps {
  jobId: string;
  jobTitle: string;
  currentStatus: string;
}

export default function JobStatusActions({
  jobId,
  jobTitle,
  currentStatus,
}: JobStatusActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState<"pause" | "close" | "resume" | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const status = currentStatus as JobStatus;

  const handleConfirm = async (newStatus: "PAUSED" | "CLOSED" | "ACTIVE") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInfoMessage(data.error || "Failed to update status.");
        setInfoOpen(true);
        setConfirmOpen(null);
        return;
      }
      setConfirmOpen(null);
      setSuccessMessage(
        newStatus === "ACTIVE"
          ? "Job resumed. It is now visible to candidates."
          : newStatus === "PAUSED"
            ? "Job paused. It is on hold and not visible to candidates. You can resume it anytime."
            : "Job closed. It is permanently closed and cannot be re-opened."
      );
      setSuccessOpen(true);
      router.refresh();
    } catch {
      setInfoMessage("Something went wrong. Please try again.");
      setInfoOpen(true);
      setConfirmOpen(null);
    } finally {
      setLoading(false);
    }
  };

  const showClosedInfo = () => {
    setInfoMessage(
      "This job is permanently closed. It is not visible to candidates and cannot be re-opened."
    );
    setInfoOpen(true);
  };

  const showPendingInfo = () => {
    setInfoMessage("This job is pending admin approval. Only an admin can activate it.");
    setInfoOpen(true);
  };

  const getStatusLabel = () => {
    if (status === "ACTIVE" || status === "INACTIVE") return "Change status";
    if (status === "PAUSED") return "Resume";
    if (status === "CLOSED" || status === "PENDING") return "Info";
    return "Status";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading} className="min-w-[120px]">
            {loading ? "Updating..." : getStatusLabel()}
            <ChevronDown className="ml-1.5 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {(status === "ACTIVE" || status === "INACTIVE") && (
            <>
              <DropdownMenuItem
                onClick={() => setConfirmOpen("pause")}
                disabled={loading}
                className="cursor-pointer"
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause job
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmOpen("close")}
                disabled={loading}
                variant="destructive"
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Close job
              </DropdownMenuItem>
            </>
          )}
          {status === "PAUSED" && (
            <DropdownMenuItem
              onClick={() => setConfirmOpen("resume")}
              disabled={loading}
              className="cursor-pointer"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Resume job
            </DropdownMenuItem>
          )}
          {(status === "CLOSED" || status === "PENDING") && (
            <DropdownMenuItem onClick={status === "CLOSED" ? showClosedInfo : showPendingInfo} className="cursor-pointer">
              <Info className="mr-2 h-4 w-4" />
              {status === "CLOSED" ? "Why is this closed?" : "Pending approval"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pause confirm */}
      <Dialog open={confirmOpen === "pause"} onOpenChange={(open) => !open && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause this job?</DialogTitle>
            <DialogDescription>
              &quot;{jobTitle}&quot; will be put on hold. Candidates will not see this job. You can
              resume it anytime from this list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => handleConfirm("PAUSED")} disabled={loading}>
              {loading ? "Updating..." : "Pause job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close confirm */}
      <Dialog open={confirmOpen === "close"} onOpenChange={(open) => !open && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close this job permanently?</DialogTitle>
            <DialogDescription>
              &quot;{jobTitle}&quot; will be closed. Candidates will not see it. This cannot be
              undone – closed jobs cannot be re-opened.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirm("CLOSED")}
              disabled={loading}
            >
              {loading ? "Updating..." : "Close job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume confirm */}
      <Dialog open={confirmOpen === "resume"} onOpenChange={(open) => !open && setConfirmOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume this job?</DialogTitle>
            <DialogDescription>
              &quot;{jobTitle}&quot; will be visible to candidates again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(null)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={() => handleConfirm("ACTIVE")} disabled={loading}>
              {loading ? "Updating..." : "Resume job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Status updated</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error / info */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Information</DialogTitle>
            <DialogDescription>{infoMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setInfoOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
