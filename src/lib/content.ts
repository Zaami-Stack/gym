import { getSessionUser } from "@/lib/auth/session";
import { defaultGallery, defaultSettings } from "@/lib/default-content";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryImage, Notification, SiteSettings } from "@/lib/types";

export async function getPublicContent() {
  const supabase = createAdminClient();
  const [settingsResult, galleryResult, notificationsResult, sessionUser] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("gallery_images").select("*").order("display_order", { ascending: true }),
    supabase
      .from("notifications")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    getSessionUser(),
  ]);

  const settings = (settingsResult.data as SiteSettings | null) ?? defaultSettings;
  const galleryRaw = galleryResult.data as GalleryImage[] | null;
  const notifications = (notificationsResult.data as Notification[] | null) ?? [];

  return {
    settings,
    gallery: galleryRaw && galleryRaw.length > 0 ? galleryRaw : defaultGallery,
    notifications,
    isAdmin: sessionUser?.role === "admin",
    hasSession: Boolean(sessionUser),
  };
}
