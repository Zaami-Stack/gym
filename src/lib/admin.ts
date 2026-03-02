import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/session";

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  if (user.role !== "admin") {
    redirect("/admin/login?error=not_admin");
  }
  return { user };
}
