import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteSettings } from "@/lib/types";

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
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to fetch settings." }, { status: 500 });
  }

  return NextResponse.json({ settings: data }, { status: 200 });
}

export async function PATCH(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<SiteSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const hero_title = String(body.hero_title || "").trim();
  const hero_subtitle = String(body.hero_subtitle || "").trim();
  const hero_image_url = String(body.hero_image_url || "").trim();

  if (!hero_title || !hero_subtitle || !hero_image_url) {
    return NextResponse.json({ message: "Hero title, subtitle and image URL are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: 1,
        hero_title,
        hero_subtitle,
        hero_image_url,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to update settings." }, { status: 500 });
  }

  return NextResponse.json({ settings: data }, { status: 200 });
}
