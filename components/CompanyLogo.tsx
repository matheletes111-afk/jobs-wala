"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  companyLogo?: string | null;
  companyName?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function CompanyLogo({
  companyLogo,
  companyName,
  className,
  size = "md",
}: CompanyLogoProps) {
  const fallbackChar = companyName?.[0]?.toUpperCase() ?? "?";

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "shrink-0 rounded-lg bg-blue-50 font-bold text-[#2563eb]",
        className
      )}
    >
      {companyLogo ? (
        <AvatarImage src={companyLogo} alt={companyName ?? "Company"} className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-lg bg-blue-50 text-[#2563eb]">
        {fallbackChar !== "?" ? (
          fallbackChar
        ) : (
          <Building2 className="h-[50%] w-[50%]" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
