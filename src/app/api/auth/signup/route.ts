import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  clearSessionCookie,
  getConfiguredAdmin,
  hashPassword,
  isAuthConfigured,
  normalizeEmail,
  setSessionCookie,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type CustomerUserRow = {
  id: string;
  name: string;
  email: string;
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

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email || "");
  const password = String(body.password || "");

  if (name.length < 2) {
    return NextResponse.json({ message: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
  }

  const admin = getConfiguredAdmin();
  if (admin && admin.email === email) {
    return NextResponse.json({ message: "This email is reserved for admin." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ message: existingError.message || "Sign up failed." }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json({ message: "Email already exists." }, { status: 400 });
  }

  const payload = {
    id: randomUUID(),
    name,
    email,
    password_hash: hashPassword(password),
    role: "customer" as const,
  };

  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select("id,name,email,role")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message || "Sign up failed." }, { status: 500 });
  }

  const customer = data as CustomerUserRow;
  const user = {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    role: "customer" as const,
  };

  await setSessionCookie(user);
  return NextResponse.json({ user }, { status: 201 });
}
