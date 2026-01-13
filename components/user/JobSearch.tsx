"use client";

import { useState, useMemo } from "react";
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
  initialJobs: Job[];
}

export default function JobSearch({ initialJobs }: JobSearchProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter jobs based on search criteria
  const filteredJobs = useMemo(() => {
    let filtered = [...initialJobs];

    // Search filter (title or description)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (category && category !== "all") {
      filtered = filtered.filter((job) => job.category === category);
    }

    // Location filter
    if (location && location.trim() !== "") {
      try {
        const locationData = JSON.parse(location);
        filtered = filtered.filter((job) => {
          try {
            const jobLocation = JSON.parse(job.location);
            let matches = false;
            
            // Priority: city > state > country
            // If city is selected, match by city (exact match)
            if (locationData.city && locationData.city.trim() !== "") {
              matches = jobLocation.city && 
                jobLocation.city.toLowerCase() === locationData.city.toLowerCase();
            }
            // If state is selected (but no city), match by state (exact match)
            else if (locationData.state && locationData.state.trim() !== "") {
              matches = jobLocation.state && 
                jobLocation.state.toLowerCase() === locationData.state.toLowerCase();
            }
            // If only country is selected, match by country (exact match)
            else if (locationData.country && locationData.country.trim() !== "") {
              matches = jobLocation.country && 
                jobLocation.country.toLowerCase() === locationData.country.toLowerCase();
            }
            
            return matches;
          } catch {
            // If job location is not JSON, check if it contains the formatted location
            try {
              const formattedLocation = formatLocation(location);
              return job.location.toLowerCase().includes(formattedLocation.toLowerCase());
            } catch {
              return job.location.toLowerCase().includes(location.toLowerCase());
            }
          }
        });
      } catch {
        // If location is not JSON, do simple string search
        if (location.trim() !== "") {
          filtered = filtered.filter((job) =>
            job.location.toLowerCase().includes(location.toLowerCase())
          );
        }
      }
    }

    return filtered;
  }, [initialJobs, search, category, location]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSearch = () => {
    handleFilterChange();
  };

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
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
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
            <Button onClick={handleSearch} className="w-full">
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No jobs found. Try adjusting your filters.</p>
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

