import { Suspense } from "react";
import DashboardLoader from "@/components/DashboardLoader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<DashboardLoader />}>{children}</Suspense>;
}
