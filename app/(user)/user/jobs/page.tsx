import { requireJobSeeker } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import JobSearch from "@/components/user/JobSearch";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await requireJobSeeker();

  const search = searchParams.search as string | undefined;
  const location = searchParams.location as string | undefined;
  const category = searchParams.category as string | undefined;
  const page = parseInt(searchParams.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = {
    status: "ACTIVE",
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (category) {
    where.category = category;
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        employer: {
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Browse Jobs</h1>
      <JobSearch
        jobs={jobs}
        total={total}
        currentPage={page}
        searchParams={searchParams}
      />
    </div>
  );
}

