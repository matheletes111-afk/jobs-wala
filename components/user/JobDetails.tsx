import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    website?: string | null;
    description?: string | null;
  };
}

export default function JobDetails({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{job.title}</CardTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{job.employer.companyName}</Badge>
          <Badge variant="outline">{formatLocation(job.location)}</Badge>
          <Badge variant="outline">{job.category}</Badge>
          <Badge variant="outline">{job.employmentType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold">Job Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{job.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Experience Required</h3>
            <p className="text-gray-700">
              {job.experienceRequired ?? 0} years
            </p>
          </div>
          {job.salaryRange && (
            <div>
              <h3 className="font-semibold">Salary Range</h3>
              <p className="text-gray-700">{job.salaryRange}</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold">About {job.employer.companyName}</h3>
          <p className="mt-2 text-gray-700">
            {job.employer.description || "No company description available."}
          </p>
          {job.employer.website && (
            <a
              href={job.employer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-600 hover:underline"
            >
              Visit Company Website
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

