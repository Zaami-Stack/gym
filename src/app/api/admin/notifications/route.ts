import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Notification } from "@/lib/types";

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
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to fetch notifications." }, { status: 500 });
  }

  return NextResponse.json({ notifications: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<Notification>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const message = String(body.message || "").trim();
  const is_active = Boolean(body.is_active);
  if (!message) {
    return NextResponse.json({ message: "Notification message is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      message,
      is_active,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to add notification." }, { status: 500 });
  }

  return NextResponse.json({ notification: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<Notification> & { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ message: "Notification id is required." }, { status: 400 });
  }

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json({ message: "is_active must be boolean." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_active: body.is_active })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to update notification." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "Notification not found." }, { status: 404 });
  }

  return NextResponse.json({ notification: data }, { status: 200 });
}

export async function DELETE(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ message: "Notification id is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: error.message || "Failed to delete notification." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
