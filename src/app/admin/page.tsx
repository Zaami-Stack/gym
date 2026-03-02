import { requireAdmin } from "@/lib/admin";
import { defaultSettings } from "@/lib/default-content";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GalleryImage, Notification, SiteSettings } from "@/lib/types";

import AdminDashboard from "./ui/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const [settingsResult, galleryResult, notificationsResult] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("gallery_images").select("*").order("display_order", { ascending: true }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
  ]);

  const settings = (settingsResult.data as SiteSettings | null) ?? defaultSettings;
  const gallery = (galleryResult.data as GalleryImage[] | null) ?? [];
  const notifications = (notificationsResult.data as Notification[] | null) ?? [];

  return (
    <AdminDashboard
      adminEmail={user.email ?? "Admin"}
      initialGallery={gallery}
      initialNotifications={notifications}
      initialSettings={settings}
    />
  );
}
