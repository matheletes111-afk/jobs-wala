"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Job {
  id: string;
  title: string;
}

interface JobFilterDropdownProps {
  jobs: Job[];
  currentJobId: string | undefined;
}

export default function JobFilterDropdown({ jobs, currentJobId }: JobFilterDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [currentJobId]);

  const handleValueChange = (value: string) => {
    if (value === (currentJobId ?? "all")) return;
    setIsLoading(true);
    const status = searchParams.get("status");
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("jobId", value);
    if (status) params.set("status", status);
    const query = params.toString();
    router.push(query ? `/employer/applications?${query}` : "/employer/applications");
  };

  return (
    <div className="relative flex items-center gap-2">
      <Select
        value={currentJobId ?? "all"}
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[280px]" size="default">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            <SelectValue placeholder="Filter by job" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All jobs</SelectItem>
          {jobs.map((job) => (
            <SelectItem key={job.id} value={job.id}>
              {job.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
