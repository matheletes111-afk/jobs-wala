"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  location?: string | null;
  experience?: number | null;
  skills: string[];
  resumeUrl?: string | null;
  user: {
    email: string;
  };
}

export default function ResumeSearch({
  searchParams: initialParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const [keyword, setKeyword] = useState((initialParams.keyword as string) || "");
  const [skills, setSkills] = useState((initialParams.skills as string) || "");
  const [location, setLocation] = useState((initialParams.location as string) || "");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (skills) params.set("skills", skills);
    if (location) params.set("location", location);

    try {
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialParams.keyword || initialParams.skills || initialParams.location) {
      handleSearch();
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search by keywords..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Input
              placeholder="Skills (comma-separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Input
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {candidates.length === 0 && !loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                No candidates found. Try adjusting your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {candidate.firstName} {candidate.lastName}
                    </h3>
                    {candidate.jobTitle && (
                      <p className="mt-1 text-gray-600">{candidate.jobTitle}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {candidate.location && (
                        <Badge variant="outline">{formatLocation(candidate.location)}</Badge>
                      )}
                      {candidate.experience !== null && (
                        <Badge variant="outline">
                          {candidate.experience} years experience
                        </Badge>
                      )}
                      {candidate.skills.slice(0, 5).map((skill, idx) => (
                        <Badge key={idx} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    {candidate.resumeUrl && (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-600 hover:underline"
                      >
                        View Resume
                      </a>
                    )}
                  </div>
                  <Link href={`/employer/candidates/${candidate.id}`}>
                    <Button>View Profile</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

