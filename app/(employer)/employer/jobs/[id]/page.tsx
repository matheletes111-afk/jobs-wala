import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatLocation } from "@/lib/utils";
import ApplicationActions from "@/components/employer/ApplicationActions";

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/employer/jobs">
          <Button variant="outline">← Back to Jobs</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">{job.title}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              variant={
                job.status === "ACTIVE"
                  ? "default"
                  : job.status === "PENDING"
                  ? "secondary"
                  : "outline"
              }
            >
              {job.status}
            </Badge>
            <Badge variant="outline">{formatLocation(job.location)}</Badge>
            <Badge variant="outline">{job.category}</Badge>
            <Badge variant="outline">{job.employmentType}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">Job Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">
              {job.description}
            </p>
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
            <div>
              <h3 className="font-semibold">Posted On</h3>
              <p className="text-gray-700">
                {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
            {job.expiresAt && (
              <div>
                <h3 className="font-semibold">Expires On</h3>
                <p className="text-gray-700">
                  {new Date(job.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {job.applications.map((application: {
                id: string;
                status: string;
                appliedAt: Date;
                coverLetter: string | null;
                jobSeeker: {
                  firstName: string;
                  lastName: string;
                  resumeUrl: string | null;
                  user: {
                    email: string;
                  };
                };
              }) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
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
                      <div className="flex flex-col items-end gap-2">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

