import { redirect } from "next/navigation";
import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function UserDashboardPage() {
  const user = await requireJobSeeker();

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: user.id },
  });

  const applicationsCount = await prisma.application.count({
    where: { jobSeekerId: user.id },
  });

  const recentApplications = await prisma.application.findMany({
    where: { jobSeekerId: user.id },
    take: 5,
    orderBy: { appliedAt: "desc" },
    include: {
      job: {
        include: {
          employer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!profile) {
    redirect("/user/profile/create");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/user/profile">
          <Button>Edit Profile</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile Status</CardTitle>
            <CardDescription>Your profile completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.resumeUrl ? "Complete" : "Incomplete"}
            </div>
            {!profile.resumeUrl && (
              <Link href="/user/profile">
                <Button variant="outline" className="mt-2 w-full">
                  Upload Resume
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Total applications submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applicationsCount}</div>
            <Link href="/user/applications">
              <Button variant="outline" className="mt-2 w-full">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/user/jobs" className="block">
              <Button variant="outline" className="w-full">
                Browse Jobs
              </Button>
            </Link>
            <Link href="/user/profile" className="block">
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Your latest job applications</CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <p className="text-gray-500">No applications yet. Start applying to jobs!</p>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application: {
                id: string;
                status: string;
                appliedAt: Date;
                job: {
                  title: string;
                  location: string | null;
                  employer: {
                    companyName: string;
                  };
                };
              }) => (
                <div
                  key={application.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <h3 className="font-semibold">{application.job.title}</h3>
                    <p className="text-sm text-gray-600">
                      {application.job.employer.companyName} • {application.job.location}
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

