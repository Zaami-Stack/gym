import { NextResponse } from "next/server";

import {
  authenticateConfiguredAdmin,
  clearSessionCookie,
  isAuthConfigured,
  normalizeEmail,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type CustomerUserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: "customer";
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    await clearSessionCookie();
    return NextResponse.json(
      {
        message: "Authentication is not configured. Set AUTH_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD.",
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

  const admin = authenticateConfiguredAdmin(email, password);
  if (admin) {
    await setSessionCookie(admin);
    return NextResponse.json({ user: admin }, { status: 200 });
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

  const customer = data as CustomerUserRow | null;
  if (!customer || customer.role !== "customer" || !verifyPassword(customer.password_hash, password)) {
    await clearSessionCookie();
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const user = {
    id: customer.id,
    email: customer.email,
    name: customer.name || "Customer",
    role: "customer" as const,
  };

  await setSessionCookie(user);
  return NextResponse.json({ user }, { status: 200 });
}
