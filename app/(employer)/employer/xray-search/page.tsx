import { requireEmployer } from "@/lib/auth-utils";
import XRaySearch from "@/components/employer/XRaySearch";

export default async function XRaySearchPage() {
  await requireEmployer();

  return <XRaySearch />;
}
