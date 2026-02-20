import { requireEmployer } from "@/lib/auth-utils";
import ResumeSearch from "@/components/employer/ResumeSearch";

export default async function ResumeSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireEmployer();
  const params = await searchParams;

  return <ResumeSearch searchParams={params} />;
}

