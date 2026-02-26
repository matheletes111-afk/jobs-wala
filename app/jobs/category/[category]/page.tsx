import Link from "next/link";
import JobsFilterPageClient from "@/components/JobsFilterPageClient";

export default async function JobsByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryEncoded } = await params;
  const categoryName = decodeURIComponent(categoryEncoded);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 lg:px-10">
          <Link
            href="/"
            className="text-sm text-[#2563eb] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
      <JobsFilterPageClient
        title={`Jobs in ${categoryName}`}
        category={categoryName}
      />
    </div>
  );
}
