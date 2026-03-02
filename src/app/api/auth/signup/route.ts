import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  clearSessionCookie,
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
  phone: string;
  role: "customer";
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

  let body: { name?: string; email?: string; phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email || "");
  const phone = String(body.phone || "").trim();
  const password = String(body.password || "");

  if (name.length < 2) {
    return NextResponse.json({ message: "Name must be at least 2 characters." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
  }
  if (!/^[0-9+\s()-]{8,20}$/.test(phone)) {
    return NextResponse.json({ message: "Valid phone number is required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
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
    phone,
    password_hash: hashPassword(password),
    role: "customer" as const,
  };

  const { data, error } = await supabase
    .from("users")
    .insert(payload)
    .select("id,name,email,phone,role")
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
