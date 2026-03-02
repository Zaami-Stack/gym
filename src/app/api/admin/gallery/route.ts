import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { isHttpImageUrl, normalizeMediaImageUrl } from "@/lib/media-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryImage } from "@/lib/types";

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
  const { data, error } = await supabase.from("gallery_images").select("*").order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to fetch gallery." }, { status: 500 });
  }

  const gallery = ((data as GalleryImage[] | null) ?? []).map((item) => ({
    ...item,
    image_url: normalizeMediaImageUrl(item.image_url),
  }));

  return NextResponse.json({ gallery }, { status: 200 });
}

export async function POST(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: Partial<GalleryImage>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const image_url = normalizeMediaImageUrl(String(body.image_url || ""));
  const alt_text = String(body.alt_text || "").trim();
  const display_order = Number(body.display_order);

  if (!image_url) {
    return NextResponse.json({ message: "Image URL is required." }, { status: 400 });
  }
  if (!isHttpImageUrl(image_url)) {
    return NextResponse.json({ message: "Image URL must be a valid http(s) link." }, { status: 400 });
  }
  if (!Number.isFinite(display_order)) {
    return NextResponse.json({ message: "Display order must be a number." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .insert({
      image_url,
      alt_text,
      display_order,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to add gallery image." }, { status: 500 });
  }

  return NextResponse.json(
    {
      image: {
        ...data,
        image_url: normalizeMediaImageUrl(data.image_url),
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: { id?: string; display_order?: number; alt_text?: string; image_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ message: "Image id is required." }, { status: 400 });
  }

  const updates: Partial<Pick<GalleryImage, "display_order" | "alt_text" | "image_url">> = {};

  if (typeof body.display_order !== "undefined") {
    const display_order = Number(body.display_order);
    if (!Number.isFinite(display_order)) {
      return NextResponse.json({ message: "Display order must be a number." }, { status: 400 });
    }
    updates.display_order = display_order;
  }

  if (Object.prototype.hasOwnProperty.call(body, "alt_text")) {
    updates.alt_text = String(body.alt_text || "").trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, "image_url")) {
    const image_url = normalizeMediaImageUrl(String(body.image_url || ""));
    if (!image_url) {
      return NextResponse.json({ message: "Image URL is required." }, { status: 400 });
    }
    if (!isHttpImageUrl(image_url)) {
      return NextResponse.json({ message: "Image URL must be a valid http(s) link." }, { status: 400 });
    }
    updates.image_url = image_url;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No gallery fields to update." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("gallery_images")
    .update(updates)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to update gallery image." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "Gallery image not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      image: {
        ...data,
        image_url: normalizeMediaImageUrl(data.image_url),
      },
    },
    { status: 200 },
  );
}

export async function DELETE(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = String(searchParams.get("id") || "");
  if (!id) {
    return NextResponse.json({ message: "Image id is required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ message: error.message || "Failed to delete gallery image." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
