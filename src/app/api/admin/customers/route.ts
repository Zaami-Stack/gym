import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerTrackerRow } from "@/lib/types";

export const runtime = "nodejs";

async function ensureAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,name,email,phone,created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to fetch customers." }, { status: 500 });
  }

  return NextResponse.json({ customers: (data as CustomerTrackerRow[] | null) ?? [] }, { status: 200 });
}
