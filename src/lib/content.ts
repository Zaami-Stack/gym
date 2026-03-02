import { defaultGallery, defaultSettings } from "@/lib/default-content";
import { createClient } from "@/lib/supabase/server";
import type { GalleryImage, Notification, SiteSettings } from "@/lib/types";

export async function getPublicContent() {
  const supabase = await createClient();

  const [settingsResult, galleryResult, notificationsResult] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("gallery_images").select("*").order("display_order", { ascending: true }),
    supabase
      .from("notifications")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const settings = (settingsResult.data as SiteSettings | null) ?? defaultSettings;
  const galleryRaw = galleryResult.data as GalleryImage[] | null;
  const notifications = (notificationsResult.data as Notification[] | null) ?? [];
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user?.email) {
    const normalizedEmail = user.email.toLowerCase();
    const { data: adminRow, error: adminError } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    isAdmin = !adminError && Boolean(adminRow);
  }

  return {
    settings,
    gallery: galleryRaw && galleryRaw.length > 0 ? galleryRaw : defaultGallery,
    notifications,
    isAdmin,
  };
}
