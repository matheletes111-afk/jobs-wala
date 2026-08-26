"use client";

import { usePathname } from "next/navigation";

export default function FooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPanelRoute = ["/admin", "/employer", "/user", "/dashboard"].some((p) =>
    pathname === p || pathname?.startsWith(p + "/")
  ) && pathname !== "/employer/jobs/new";

  // Hide the global root footer on panel routes because panels render their own inner footer with sidebar padding
  if (isPanelRoute) {
    return null;
  }

  return <>{children}</>;
}
