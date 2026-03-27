import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ApplicationActions from "@/components/employer/ApplicationActions";
import SkillMatchBar from "@/components/employer/SkillMatchBar";
import JobDetails from "@/components/user/JobDetails";
import CandidateAvatar from "@/components/CandidateAvatar";
import { computeSkillMatch } from "@/lib/skill-match";

export default async function EmployerJobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireEmployer();
  const { id } = await params;

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return <div>Please complete your profile first.</div>;
  }

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      employer: true,
      applications: {
        include: {
          jobSeeker: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!job || job.postedBy !== profile.userId) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-10">
      <div className="mb-6">
        <Link href="/employer/jobs">
          <Button variant="outline">← Back to Jobs</Button>
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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
          {(job.status === "PAUSED" || job.status === "CLOSED") && (
            <span className="text-sm text-gray-500">
              {job.status === "PAUSED"
                ? "Not visible to candidates. Resume from My Jobs list."
                : "Permanently closed. Cannot be re-opened."}
            </span>
          )}
        </div>
        <JobDetails
          job={{
            id: job.id,
            title: job.title,
            description: job.description,
            location: job.location,
            category: job.category,
            salaryRange: job.salaryRange,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            currency: job.currency,
            payType: job.payType,
            employmentType: job.employmentType,
            experienceRequired: job.experienceRequired,
            experienceMin: job.experienceMin,
            experienceMax: job.experienceMax,
            requiredSkills: job.requiredSkills ?? [],
            secondarySkills: job.secondarySkills ?? [],
            createdAt: job.createdAt,
            employer: {
              companyName: job.employer.companyName,
              companyLogo: job.employer.companyLogo,
              website: job.employer.website,
              description: job.employer.description,
            },
          }}
        />
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
          {job.expiresAt && (
            <span>Expires: {new Date(job.expiresAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Applications ({job.applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {job.applications.length === 0 ? (
            <p className="text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {job.applications.map((application) => {
                const skillMatch = computeSkillMatch(
                  job.requiredSkills ?? [],
                  application.jobSeeker.skills ?? []
                );
                return (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <CandidateAvatar
                        profileImage={application.jobSeeker.profileImage}
                        firstName={application.jobSeeker.firstName}
                        lastName={application.jobSeeker.lastName}
                        size="md"
                        className="shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold">
                          {application.jobSeeker.firstName}{" "}
                          {application.jobSeeker.lastName}
                        </h3>
                        <p className="mt-1 text-gray-600">
                          {application.jobSeeker.user.email}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Applied on{" "}
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-3 max-w-md">
                          <SkillMatchBar
                            percent={skillMatch.percent}
                            matched={skillMatch.matched}
                            total={skillMatch.total}
                            matchedLabels={skillMatch.matchedLabels}
                          />
                        </div>
                        {application.coverLetter && (
                          <div className="mt-3">
                            <h4 className="text-sm font-semibold">
                              Cover Letter:
                            </h4>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                        {application.jobSeeker.resumeUrl && (
                          <a
                            href={application.jobSeeker.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-blue-600 hover:underline"
                          >
                            View Resume
                          </a>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge
                          variant={
                            application.status === "SHORTLISTED"
                              ? "default"
                              : application.status === "REJECTED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {application.status}
                        </Badge>
                        <ApplicationActions
                          applicationId={application.id}
                          currentStatus={application.status}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

