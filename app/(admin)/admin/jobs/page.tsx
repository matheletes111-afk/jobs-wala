import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JobApprovalActions from "@/components/admin/JobApprovalActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocation } from "@/lib/utils";

export default async function AdminJobsPage() {
  await requireAdmin();

  const jobs = await prisma.job.findMany({
    include: {
      employer: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Job Management</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.employer.companyName}</TableCell>
                  <TableCell>{formatLocation(job.location)}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{job._count.applications}</TableCell>
                  <TableCell>
                    <JobApprovalActions jobId={job.id} currentStatus={job.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

