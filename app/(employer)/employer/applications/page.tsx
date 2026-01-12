import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ApplicationActions from "@/components/employer/ApplicationActions";

export default async function EmployerApplicationsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return <div>Please complete your profile first.</div>;
  }

  const jobId = searchParams.jobId as string | undefined;
  const status = searchParams.status as string | undefined;

  const where: any = {
    job: { postedBy: profile.userId },
  };

  if (jobId) {
    where.jobId = jobId;
  }

  if (status) {
    where.status = status;
  }

  const applications = await prisma.application.findMany({
    where,
    orderBy: { appliedAt: "desc" },
    include: {
      job: true,
      jobSeeker: {
        include: {
          user: true,
        },
      },
    },
  });

  const jobs = await prisma.job.findMany({
    where: { postedBy: profile.userId },
    select: { id: true, title: true },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Applications</h1>

      <div className="mb-6 flex gap-4">
        <Link href="/employer/applications">
          <Button variant={!status ? "default" : "outline"}>All</Button>
        </Link>
        <Link href="/employer/applications?status=PENDING">
          <Button variant={status === "PENDING" ? "default" : "outline"}>
            Pending
          </Button>
        </Link>
        <Link href="/employer/applications?status=SHORTLISTED">
          <Button variant={status === "SHORTLISTED" ? "default" : "outline"}>
            Shortlisted
          </Button>
        </Link>
        <Link href="/employer/applications?status=REJECTED">
          <Button variant={status === "REJECTED" ? "default" : "outline"}>
            Rejected
          </Button>
        </Link>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No applications found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {application.jobSeeker.firstName} {application.jobSeeker.lastName}
                    </h3>
                    <p className="mt-1 text-gray-600">
                      Applied for: {application.job.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Applied on {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                    {application.coverLetter && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {application.coverLetter}
                      </p>
                    )}
                    {application.jobSeeker.resumeUrl && (
                      <a
                        href={application.jobSeeker.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-blue-600 hover:underline"
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
                    <ApplicationActions applicationId={application.id} currentStatus={application.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

