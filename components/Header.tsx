import { getCurrentUser } from "@/lib/auth-utils";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <HeaderClient
      user={
        user
          ? {
              id: user.id,
              role: user.role,
            }
          : null
      }
    />
  );
}
