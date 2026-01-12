import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminReportsPage() {
  await requireAdmin();

  const exportUsers = async () => {
    "use server";
    const users = await prisma.user.findMany({
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    const csv = [
      ["Email", "Role", "Created At"].join(","),
      ...users.map(
        (u) =>
          `"${u.email}","${u.role}","${u.createdAt.toISOString()}"`
      ),
    ].join("\n");

    return csv;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Reports & Exports</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Export Users</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/admin/export/users" method="GET">
              <Button type="submit">Download CSV</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/admin/export/jobs" method="GET">
              <Button type="submit">Download CSV</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/api/admin/export/applications" method="GET">
              <Button type="submit">Download CSV</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

