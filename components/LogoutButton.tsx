"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export default function LogoutButton({ className, showText = true }: LogoutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Use redirect: false to prevent automatic redirect and avoid JSON parsing errors
      await signOut({ 
        callbackUrl: "/login",
        redirect: false 
      });
      // Manually redirect after signout
      router.push("/login");
      router.refresh();
    } catch (error) {
      // If signOut fails, still redirect to login
      console.error("Sign out error:", error);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className={className || "text-red-600 hover:bg-red-50 hover:text-red-700"}
    >
      <LogOut className="h-4.5 w-4.5 shrink-0" />
      {showText && <span>Logout</span>}
    </Button>
  );
}

