"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  employmentType: string;
  experienceRequired?: number | null;
  createdAt: Date;
  employer: {
    companyName: string;
  };
}

interface HomeJobListProps {
  jobs: Job[];
}

export default function HomeJobList({ jobs }: HomeJobListProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleApply = (jobId: string) => {
    if (!session) {
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent(`/user/jobs/${jobId}`)}`);
    } else {
      // User is logged in, go to job details page
      router.push(`/user/jobs/${jobId}`);
    }
  };

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link href={`/user/jobs/${job.id}`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600">
                    {job.title}
                  </h3>
                </Link>
                <p className="mt-1 text-gray-600">{job.employer.companyName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{formatLocation(job.location)}</Badge>
                  <Badge variant="outline">{job.category}</Badge>
                  <Badge variant="outline">{job.employmentType}</Badge>
                  {job.salaryRange && (
                    <Badge variant="outline">{job.salaryRange}</Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {job.description}
                </p>
              </div>
              <div className="ml-4 flex gap-2">
                <Link href={`/user/jobs/${job.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                <Button onClick={() => handleApply(job.id)}>Apply</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
