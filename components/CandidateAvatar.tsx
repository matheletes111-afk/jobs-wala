"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CandidateAvatarProps {
  profileImage?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function CandidateAvatar({
  profileImage,
  firstName,
  lastName,
  className,
  size = "md",
}: CandidateAvatarProps) {
  const fallbackChar = firstName?.[0]?.toUpperCase() ?? lastName?.[0]?.toUpperCase() ?? "?";

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "shrink-0 rounded-lg bg-violet-50 font-bold text-violet-600",
        className
      )}
    >
      {profileImage ? (
        <AvatarImage src={profileImage} alt={`${firstName} ${lastName}`} className="object-cover" />
      ) : null}
      <AvatarFallback className="rounded-lg bg-violet-50 text-violet-600">
        {fallbackChar !== "?" ? (
          fallbackChar
        ) : (
          <User className="h-[50%] w-[50%]" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
