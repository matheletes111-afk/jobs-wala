import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EmployerDashboardPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-gray-600">Please complete your company profile first.</p>
            <Link href="/employer/profile">
              <Button>Complete Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [jobsCount, applicationsCount, activeJobs] = await Promise.all([
    prisma.job.count({ where: { postedBy: profile.userId } }),
    prisma.application.count({
      where: {
        job: { postedBy: profile.userId },
      },
    }),
    prisma.job.count({
      where: { postedBy: profile.userId, status: "ACTIVE" },
    }),
  ]);

  const recentApplications = await prisma.application.findMany({
    where: {
      job: { postedBy: profile.userId },
    },
    take: 5,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/employer/jobs/new">
          <Button>Post New Job</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Jobs</CardTitle>
            <CardDescription>Jobs posted by you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsCount}</div>
            <Link href="/employer/jobs">
              <Button variant="outline" className="mt-2 w-full">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Currently active job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Total applications received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsCount}</div>
            <Link href="/employer/applications">
              <Button variant="outline" className="mt-2 w-full">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Latest job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <p className="text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <h3 className="font-semibold">{application.job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {application.jobSeeker.firstName} {application.jobSeeker.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Applied on {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                    {application.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

