import { requireAdmin } from "@/lib/admin";
import { defaultSettings } from "@/lib/default-content";
import { normalizeMediaImageUrl } from "@/lib/media-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomerTrackerRow, GalleryImage, Notification, SiteSettings } from "@/lib/types";

import AdminDashboard from "./ui/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const supabase = createAdminClient();

  const [settingsResult, galleryResult, notificationsResult, customersResult] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("gallery_images").select("*").order("display_order", { ascending: true }),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }),
    supabase.from("users").select("id,name,email,phone,created_at").order("created_at", { ascending: false }),
  ]);

  const settings = (settingsResult.data as SiteSettings | null) ?? defaultSettings;
  const gallery = ((galleryResult.data as GalleryImage[] | null) ?? []).map((item) => ({
    ...item,
    image_url: normalizeMediaImageUrl(item.image_url),
  }));
  const notifications = (notificationsResult.data as Notification[] | null) ?? [];
  const customers = (customersResult.data as CustomerTrackerRow[] | null) ?? [];

  return (
    <AdminDashboard
      adminEmail={user.email ?? "Admin"}
      initialCustomers={customers}
      initialGallery={gallery}
      initialNotifications={notifications}
      initialSettings={settings}
    />
  );
}
