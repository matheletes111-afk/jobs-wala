"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatLocation, stripHtml } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";

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
  companyName?: string | null;
  employer: {
    companyName: string;
    companyLogo?: string | null;
  };
}

interface HomeJobListProps {
  jobs: Job[];
}

export default function HomeJobList({ jobs }: HomeJobListProps) {
  const { data: session } = useSession();

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <CompanyLogo
                companyLogo={job.employer.companyLogo}
                companyName={job.companyName || job.employer.companyName}
                size="md"
                className="shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${job.id}?from=/`}>
                  <h3 className="text-xl font-semibold hover:text-blue-600">
                    {job.title}
                  </h3>
                </Link>
                <p className="mt-1 text-gray-600">{job.companyName || job.employer.companyName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{formatLocation(job.location, true)}</Badge>
                  <Badge variant="outline">{job.category}</Badge>
                  <Badge variant="outline">{job.employmentType}</Badge>
                  {job.salaryRange && (
                    <Badge variant="outline">{job.salaryRange}</Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                  {stripHtml(job.description)}
                </p>
              </div>
              <div className="ml-auto flex shrink-0 gap-2">
                <Link href={`/jobs/${job.id}?from=/`}>
                  <Button variant="outline">View Details</Button>
                </Link>
                {session && (
                  <Link href={`/jobs/${job.id}?from=/`}>
                    <Button>Apply</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
