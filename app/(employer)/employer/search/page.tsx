import { requireEmployer } from "@/lib/auth-utils";
import ResumeSearch from "@/components/employer/ResumeSearch";

export default async function ResumeSearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await requireEmployer();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Search Candidates</h1>
      <ResumeSearch searchParams={searchParams} />
    </div>
  );
}

