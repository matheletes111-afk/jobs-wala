import { requireEmployer } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLocation } from "@/lib/utils";

export default async function EmployerJobsPage() {
  const user = await requireEmployer();

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Please complete your profile first.</p>
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { postedBy: profile.userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <Link href="/employer/jobs/new">
          <Button>Post New Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-gray-500">You haven't posted any jobs yet.</p>
            <Link href="/employer/jobs/new">
              <Button>Post Your First Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: {
            id: string;
            title: string;
            location: string | null;
            category: string;
            status: string;
            _count: {
              applications: number;
            };
          }) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/employer/jobs/${job.id}`}>
                      <h3 className="text-xl font-semibold hover:text-blue-600">
                        {job.title}
                      </h3>
                    </Link>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">{formatLocation(job.location)}</Badge>
                      <Badge variant="outline">{job.category}</Badge>
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
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {job._count.applications} application{job._count.applications !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link href={`/employer/jobs/${job.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

