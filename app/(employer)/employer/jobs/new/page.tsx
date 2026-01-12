import { requireEmployer } from "@/lib/auth-utils";
import JobForm from "@/components/employer/JobForm";

export default async function NewJobPage() {
  await requireEmployer();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Post New Job</h1>
      <JobForm />
    </div>
  );
}

