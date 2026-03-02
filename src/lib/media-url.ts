export function isHttpImageUrl(value: string) {
  try {
    const parsed = new URL(String(value || "").trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Converts Supabase signed media URLs to stable public URLs.
// Example:
// /storage/v1/object/sign/media/path/file.jpg?token=... -> /storage/v1/object/public/media/path/file.jpg
export function normalizeMediaImageUrl(value: string) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    const signSegment = "/storage/v1/object/sign/";
    const publicSegment = "/storage/v1/object/public/";

    const signIndex = url.pathname.indexOf(signSegment);
    if (signIndex >= 0) {
      const suffix = url.pathname.slice(signIndex + signSegment.length);
      if (suffix.startsWith("media/")) {
        url.pathname = `${url.pathname.slice(0, signIndex)}${publicSegment}${suffix}`;
        url.search = "";
        return url.toString();
      }
    }

    const publicIndex = url.pathname.indexOf(publicSegment);
    if (publicIndex >= 0) {
      const suffix = url.pathname.slice(publicIndex + publicSegment.length);
      if (suffix.startsWith("media/")) {
        url.search = "";
        return url.toString();
      }
    }

    return raw;
  } catch {
    return raw;
  }
}
