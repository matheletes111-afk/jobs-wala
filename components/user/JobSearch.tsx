"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

interface JobSearchProps {
  jobs: Job[];
  total: number;
  currentPage: number;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function JobSearch({
  jobs,
  total,
  currentPage,
  searchParams,
}: JobSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search as string || "");
  const [location, setLocation] = useState(searchParams.location as string || "");
  const categoryParam = searchParams.category as string || "";
  const [category, setCategory] = useState(categoryParam || "all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    if (category && category !== "all") params.set("category", category);
    params.set("page", "1");
    router.push(`/user/jobs?${params.toString()}`);
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No jobs found. Try adjusting your filters.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Found {total} job{total !== 1 ? "s" : ""}
            </p>
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
                        <Badge variant="outline">{job.location}</Badge>
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
                    <Link href={`/user/jobs/${job.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set("page", String(currentPage - 1));
              router.push(`/user/jobs?${params.toString()}`);
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set("page", String(currentPage + 1));
              router.push(`/user/jobs?${params.toString()}`);
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

