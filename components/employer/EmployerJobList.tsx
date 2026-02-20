"use client";

import { useState, useMemo, useEffect } from "react";
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
import { formatLocation } from "@/lib/utils";
import LocationDropdown from "@/components/user/LocationDropdown";
import JobStatusActions from "@/components/employer/JobStatusActions";

interface EmployerJob {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  _count: {
    applications: number;
  };
}

interface EmployerJobListProps {
  initialJobs: EmployerJob[];
}

interface CategoryOption {
  id: string;
  name: string;
  status: string;
}

function matchLocation(locationFilter: string, jobLocation: string): boolean {
  try {
    const locationData = JSON.parse(locationFilter);
    try {
      const jobLoc = JSON.parse(jobLocation);
      if (locationData.city?.trim()) {
        return !!(
          jobLoc.city &&
          jobLoc.city.toLowerCase() === locationData.city.toLowerCase()
        );
      }
      if (locationData.state?.trim()) {
        return !!(
          jobLoc.state &&
          jobLoc.state.toLowerCase() === locationData.state.toLowerCase()
        );
      }
      if (locationData.country?.trim()) {
        return !!(
          jobLoc.country &&
          jobLoc.country.toLowerCase() === locationData.country.toLowerCase()
        );
      }
    } catch {
      const formatted = formatLocation(locationFilter);
      return jobLocation.toLowerCase().includes(formatted.toLowerCase());
    }
  } catch {
    return jobLocation.toLowerCase().includes(locationFilter.toLowerCase());
  }
  return false;
}

export default function EmployerJobList({ initialJobs }: EmployerJobListProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/categories?activeOnly=true")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const filteredJobs = useMemo(() => {
    let filtered = [...initialJobs];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          (job.description &&
            job.description.toLowerCase().includes(searchLower))
      );
    }

    if (category && category !== "all") {
      filtered = filtered.filter((job) => job.category === category);
    }

    if (location.trim()) {
      filtered = filtered.filter((job) => matchLocation(location, job.location));
    }

    return filtered;
  }, [initialJobs, search, category, location]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = () => setCurrentPage(1);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  handleFilterChange();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
              />
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <LocationDropdown
                value={location}
                onChange={(value) => {
                  setLocation(value);
                  handleFilterChange();
                }}
              />
            </div>
            <Button size="sm" onClick={handleFilterChange}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No jobs match your filters. Try adjusting your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Found {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
            </p>
            {paginatedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/employer/jobs/${job.id}`}>
                        <h3 className="text-xl font-semibold hover:text-blue-600">
                          {job.title}
                        </h3>
                      </Link>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {formatLocation(job.location)}
                        </Badge>
                        <Badge variant="outline">{job.category}</Badge>
                        <Badge
                          variant={
                            job.status === "ACTIVE"
                              ? "default"
                              : job.status === "PENDING"
                                ? "secondary"
                                : job.status === "PAUSED"
                                  ? "outline"
                                  : job.status === "CLOSED"
                                    ? "destructive"
                                    : "outline"
                          }
                        >
                          {job.status === "PAUSED"
                            ? "Paused (on hold)"
                            : job.status === "CLOSED"
                              ? "Closed"
                              : job.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {job._count.applications} application
                        {job._count.applications !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <JobStatusActions
                        jobId={job.id}
                        jobTitle={job.title}
                        currentStatus={job.status}
                      />
                      <Link href={`/employer/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
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
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
