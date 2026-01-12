"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
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
    >
      Logout
    </Button>
  );
}

