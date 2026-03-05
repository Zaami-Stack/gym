import { NextResponse } from "next/server";

import { getSessionUser, normalizeEmail } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type UserRoleRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  created_at: string;
};

async function ensureAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

export async function POST(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email || "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: foundUser, error: findError } = await supabase
    .from("users")
    .select("id,name,email,role,created_at")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ message: findError.message || "Failed to find user." }, { status: 500 });
  }
  if (!foundUser) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const user = foundUser as UserRoleRow;
  if (user.role === "admin") {
    return NextResponse.json({ user, message: "User is already admin." }, { status: 200 });
  }

  const { data: promotedUser, error: promoteError } = await supabase
    .from("users")
    .update({ role: "admin" })
    .eq("id", user.id)
    .select("id,name,email,role,created_at")
    .single();

  if (promoteError) {
    return NextResponse.json({ message: promoteError.message || "Failed to promote user." }, { status: 500 });
  }

  return NextResponse.json({ user: promotedUser, message: "User promoted to admin." }, { status: 200 });
}
