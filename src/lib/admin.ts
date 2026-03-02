import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/admin/login");
  }

  const normalizedEmail = user.email?.toLowerCase();

  if (!normalizedEmail) {
    redirect("/admin/login?error=not_admin");
  }

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_emails")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (adminError || !adminRow) {
    redirect("/admin/login?error=not_admin");
  }

  return { supabase, user };
}
