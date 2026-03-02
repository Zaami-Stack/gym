import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as Pick<Profile, "role"> | null;

  if (profileError || profile?.role !== "admin") {
    redirect("/admin/login?error=not_admin");
  }

  return { supabase, user };
}
