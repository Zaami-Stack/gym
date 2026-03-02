import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { normalizeMediaImageUrl } from "@/lib/media-url";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

async function ensureAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

function getSafeExtension(file: File) {
  const fromType = MIME_EXTENSION[file.type || ""];
  if (fromType) {
    return fromType;
  }

  const rawName = String(file.name || "").trim().toLowerCase();
  const rawExtension = rawName.includes(".") ? rawName.split(".").pop() : "";
  if (rawExtension && /^[a-z0-9]{2,5}$/.test(rawExtension)) {
    return rawExtension;
  }

  return "bin";
}

export async function POST(request: Request) {
  const admin = await ensureAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ message: "Image file is required." }, { status: 400 });
  }
  if (!String(fileEntry.type || "").startsWith("image/")) {
    return NextResponse.json({ message: "Only image files are allowed." }, { status: 400 });
  }
  if (fileEntry.size <= 0) {
    return NextResponse.json({ message: "Image file is empty." }, { status: 400 });
  }
  if (fileEntry.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "Image is too large (max 10MB)." }, { status: 400 });
  }

  const extension = getSafeExtension(fileEntry);
  const filePath = `gallery/${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await fileEntry.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from("media").upload(filePath, bytes, {
    contentType: fileEntry.type || undefined,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ message: error.message || "Failed to upload image." }, { status: 500 });
  }

  const { data } = supabase.storage.from("media").getPublicUrl(filePath);
  const image_url = normalizeMediaImageUrl(data.publicUrl);
  return NextResponse.json({ image_url, path: filePath }, { status: 201 });
}
