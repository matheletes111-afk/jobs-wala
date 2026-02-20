import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLocation } from "@/lib/utils";
import CompanyLogo from "@/components/CompanyLogo";

const PAY_TYPE_LABELS: Record<string, string> = {
  HOURLY: "Hourly",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  salaryRange?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  payType?: string | null;
  employmentType: string;
  experienceRequired?: number | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  requiredSkills?: string[];
  secondarySkills?: string[];
  createdAt: Date;
  employer: {
    companyName: string;
    companyLogo?: string | null;
    website?: string | null;
    description?: string | null;
  };
}

function formatSalary(job: Job): string | null {
  if (job.salaryMin != null && job.salaryMax != null) {
    const curr = job.currency || "";
    const pay = job.payType ? PAY_TYPE_LABELS[job.payType] || job.payType : "";
    return `${curr} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}${pay ? ` (${pay})` : ""}`.trim();
  }
  if (job.salaryRange) return job.salaryRange;
  return null;
}

export default function JobDetails({ job }: { job: Job }) {
  const salaryStr = formatSalary(job);
  const hasExperienceRange = job.experienceMin != null || job.experienceMax != null;
  const experienceStr = hasExperienceRange
    ? [job.experienceMin, job.experienceMax].filter((n) => n != null).join(" - ") + " years"
    : `${job.experienceRequired ?? 0} years`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <CompanyLogo
            companyLogo={job.employer.companyLogo}
            companyName={job.employer.companyName}
            size="lg"
            className="shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-3xl">{job.title}</CardTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{job.employer.companyName}</Badge>
              <Badge variant="outline">{formatLocation(job.location)}</Badge>
              <Badge variant="outline">{job.category}</Badge>
              <Badge variant="outline">{job.employmentType}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold">Job Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{job.description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Experience</h3>
            <p className="text-gray-700">{experienceStr}</p>
          </div>
          {salaryStr && (
            <div>
              <h3 className="font-semibold">Salary Range</h3>
              <p className="text-gray-700">{salaryStr}</p>
            </div>
          )}
        </div>

        {(job.requiredSkills?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-semibold">Required Skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.requiredSkills!.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {(job.secondarySkills?.length ?? 0) > 0 && (
          <div>
            <h3 className="font-semibold">Secondary Skills</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.secondarySkills!.map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        )}

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

