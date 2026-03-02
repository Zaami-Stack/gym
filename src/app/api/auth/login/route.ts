import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  isAuthConfigured,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type AppUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "admin" | "customer";
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    await clearSessionCookie();
    return NextResponse.json(
      {
        message: "Authentication is not configured. Set AUTH_SECRET.",
      },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email || "");
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id,name,email,password_hash,role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    await clearSessionCookie();
    return NextResponse.json({ message: error.message || "Login failed." }, { status: 500 });
  }

  const account = data as AppUserRow | null;
  if (
    !account ||
    (account.role !== "admin" && account.role !== "customer") ||
    !verifyPassword(account.password_hash, password)
  ) {
    await clearSessionCookie();
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const user = {
    id: account.id,
    email: account.email,
    name: account.name || "User",
    role: account.role,
  };

  await setSessionCookie(user);
  return NextResponse.json({ user }, { status: 200 });
}
