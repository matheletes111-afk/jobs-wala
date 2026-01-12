import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ApplicationsPage() {
  const user = await requireJobSeeker();

  const applications = await prisma.application.findMany({
    where: { jobSeekerId: user.id },
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My Applications</h1>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">You haven't applied to any jobs yet.</p>
            <Link href="/user/jobs">
              <span className="mt-4 inline-block text-blue-600 hover:underline">
                Browse Jobs
              </span>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/user/jobs/${application.job.id}`}>
                      <h3 className="text-xl font-semibold hover:text-blue-600">
                        {application.job.title}
                      </h3>
                    </Link>
                    <p className="mt-1 text-gray-600">
                      {application.job.employer.companyName} • {application.job.location}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Applied on {new Date(application.appliedAt).toLocaleDateString()}
                    </p>
                    {application.coverLetter && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

