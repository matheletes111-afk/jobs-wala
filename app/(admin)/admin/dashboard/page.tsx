import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLocation } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [usersCount, jobsCount, applicationsCount, employersCount] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.user.count({ where: { role: "EMPLOYER" } }),
  ]);

  const recentJobs = await prisma.job.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>All registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employers</CardTitle>
            <CardDescription>Registered employers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Jobs</CardTitle>
            <CardDescription>All job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Total applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{applicationsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>Latest job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-b pb-4"
              >
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-gray-600">
                    {job.employer.companyName} • {formatLocation(job.location)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Posted on {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

