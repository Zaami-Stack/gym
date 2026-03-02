"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { GalleryImage, Notification, SiteSettings } from "@/lib/types";

const STORAGE_BUCKET = "media";

type Status = {
  tone: "success" | "error";
  message: string;
} | null;

type AdminDashboardProps = {
  adminEmail: string;
  initialSettings: SiteSettings;
  initialGallery: GalleryImage[];
  initialNotifications: Notification[];
};

function sortGallery(images: GalleryImage[]) {
  return [...images].sort((a, b) => a.display_order - b.display_order);
}

function getFileExtension(filename: string) {
  const pieces = filename.split(".");
  return pieces.length > 1 ? pieces[pieces.length - 1] : "jpg";
}

export default function AdminDashboard({
  adminEmail,
  initialSettings,
  initialGallery,
  initialNotifications,
}: AdminDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => (typeof window === "undefined" ? null : createClient()), []);

  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [gallery, setGallery] = useState<GalleryImage[]>(sortGallery(initialGallery));
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [status, setStatus] = useState<Status>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [heroFile, setHeroFile] = useState<File | null>(null);

  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeActive, setNoticeActive] = useState(true);

  const [galleryUrl, setGalleryUrl] = useState("");
  const [galleryAlt, setGalleryAlt] = useState("");
  const [galleryOrder, setGalleryOrder] = useState("1");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryOrderDrafts, setGalleryOrderDrafts] = useState<Record<string, string>>(
    () =>
      initialGallery.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = String(item.display_order);
        return acc;
      }, {}),
  );

  function getSupabaseClient() {
    if (!supabase) {
      throw new Error("Supabase client is not ready.");
    }
    return supabase;
  }

  async function uploadImage(file: File) {
    const client = getSupabaseClient();
    const ext = getFileExtension(file.name);
    const filePath = `gym/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await client.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSaveHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("save-hero");
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const heroTitle = settings.hero_title.trim();
      const heroSubtitle = settings.hero_subtitle.trim();
      let heroImageUrl = settings.hero_image_url.trim();

      if (heroFile) {
        heroImageUrl = await uploadImage(heroFile);
      }

      if (!heroTitle || !heroSubtitle || !heroImageUrl) {
        throw new Error("Hero title, subtitle, and image are required.");
      }

      const payload = {
        id: 1,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_image_url: heroImageUrl,
      };

      const { data, error } = await client.from("site_settings").upsert(payload, { onConflict: "id" }).select().maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      setSettings((data as SiteSettings | null) ?? { ...settings, ...payload, updated_at: settings.updated_at });
      setHeroFile(null);
      setStatus({ tone: "success", message: "Hero section updated." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update hero.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("add-notification");
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const message = noticeMessage.trim();
      if (!message) {
        throw new Error("Notification message cannot be empty.");
      }

      const { data, error } = await client
        .from("notifications")
        .insert({
          message,
          is_active: noticeActive,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const row = data as Notification;
      setNotifications((current) => [row, ...current]);
      setNoticeMessage("");
      setNoticeActive(true);
      setStatus({ tone: "success", message: "Notification added." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add notification.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleNotification(id: string, nextValue: boolean) {
    setBusyAction(`toggle-notification-${id}`);
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const { error } = await client.from("notifications").update({ is_active: nextValue }).eq("id", id);
      if (error) {
        throw new Error(error.message);
      }

      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, is_active: nextValue } : item)));
      setStatus({ tone: "success", message: "Notification updated." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update notification.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteNotification(id: string) {
    setBusyAction(`delete-notification-${id}`);
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const { error } = await client.from("notifications").delete().eq("id", id);
      if (error) {
        throw new Error(error.message);
      }

      setNotifications((current) => current.filter((item) => item.id !== id));
      setStatus({ tone: "success", message: "Notification deleted." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete notification.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddGalleryImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("add-gallery");
    setStatus(null);

    try {
      const client = getSupabaseClient();
      let imageUrl = galleryUrl.trim();
      if (galleryFile) {
        imageUrl = await uploadImage(galleryFile);
      }

      if (!imageUrl) {
        throw new Error("Choose a file or provide an image URL.");
      }

      const orderValue = Number.parseInt(galleryOrder, 10);
      if (!Number.isFinite(orderValue)) {
        throw new Error("Display order must be a valid number.");
      }

      const { data, error } = await client
        .from("gallery_images")
        .insert({
          image_url: imageUrl,
          alt_text: galleryAlt.trim(),
          display_order: orderValue,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const row = data as GalleryImage;
      setGallery((current) => sortGallery([...current, row]));
      setGalleryOrderDrafts((current) => ({
        ...current,
        [row.id]: String(row.display_order),
      }));
      setGalleryUrl("");
      setGalleryAlt("");
      setGalleryOrder(String(orderValue + 1));
      setGalleryFile(null);
      setStatus({ tone: "success", message: "Gallery image added." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add gallery image.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteGalleryImage(id: string) {
    setBusyAction(`delete-gallery-${id}`);
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const { error } = await client.from("gallery_images").delete().eq("id", id);
      if (error) {
        throw new Error(error.message);
      }

      setGallery((current) => current.filter((item) => item.id !== id));
      setGalleryOrderDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setStatus({ tone: "success", message: "Gallery image deleted." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete gallery image.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveGalleryOrder(id: string) {
    setBusyAction(`order-gallery-${id}`);
    setStatus(null);

    try {
      const client = getSupabaseClient();
      const draft = galleryOrderDrafts[id];
      const nextOrder = Number.parseInt(draft, 10);
      if (!Number.isFinite(nextOrder)) {
        throw new Error("Order must be a valid number.");
      }

      const { error } = await client.from("gallery_images").update({ display_order: nextOrder }).eq("id", id);
      if (error) {
        throw new Error(error.message);
      }

      setGallery((current) =>
        sortGallery(current.map((item) => (item.id === id ? { ...item, display_order: nextOrder } : item))),
      );
      setStatus({ tone: "success", message: "Gallery order updated." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update gallery order.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignOut() {
    setBusyAction("signout");
    setStatus(null);

    const client = getSupabaseClient();
    await client.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-panel/75 p-6">
        <div>
          <p className="font-heading text-4xl text-paper md:text-5xl">Admin Dashboard</p>
          <p className="mt-1 text-sm text-muted">Signed in as {adminEmail}</p>
          <p className="mt-1 text-xs text-muted">Use this dashboard to control the live gym website content.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="rounded-full border border-line px-4 py-2 text-sm text-paper hover:border-accent">
            View Website
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busyAction === "signout"}
            className="rounded-full border border-accent-2/60 px-4 py-2 text-sm text-accent-2 hover:border-accent-2 disabled:opacity-60"
          >
            {busyAction === "signout" ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      {status ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            status.tone === "success"
              ? "border-accent/45 bg-accent/10 text-accent"
              : "border-accent-2/45 bg-accent-2/10 text-accent-2"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-line bg-black/30 p-5">
          <h2 className="font-heading text-4xl text-paper">Hero Section</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSaveHero}>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                value={settings.hero_title}
                onChange={(event) => setSettings((current) => ({ ...current, hero_title: event.target.value }))}
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Subtitle</span>
              <textarea
                value={settings.hero_subtitle}
                onChange={(event) => setSettings((current) => ({ ...current, hero_subtitle: event.target.value }))}
                className="h-24 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Image URL</span>
              <input
                type="url"
                value={settings.hero_image_url}
                onChange={(event) => setSettings((current) => ({ ...current, hero_image_url: event.target.value }))}
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Or Upload New Hero Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1 file:text-black"
              />
            </label>
            <button
              type="submit"
              disabled={busyAction === "save-hero"}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent/85 disabled:opacity-60"
            >
              {busyAction === "save-hero" ? "Saving..." : "Save Hero Section"}
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-line bg-black/30 p-5">
          <h2 className="font-heading text-4xl text-paper">Notifications</h2>
          <form className="mt-4 space-y-3" onSubmit={handleAddNotification}>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Message</span>
              <input
                value={noticeMessage}
                onChange={(event) => setNoticeMessage(event.target.value)}
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
                placeholder="e.g. New boxing class starts Monday!"
                required
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={noticeActive}
                onChange={(event) => setNoticeActive(event.target.checked)}
                className="size-4 rounded border-line"
              />
              Active on website
            </label>
            <button
              type="submit"
              disabled={busyAction === "add-notification"}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent/85 disabled:opacity-60"
            >
              {busyAction === "add-notification" ? "Adding..." : "Add Notification"}
            </button>
          </form>
          <div className="mt-5 space-y-2">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-panel/80 p-3">
                <p className="text-sm text-paper">{item.message}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(item.id, !item.is_active)}
                    disabled={busyAction === `toggle-notification-${item.id}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.is_active
                        ? "border border-accent/50 text-accent"
                        : "border border-muted/40 text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(item.id)}
                    disabled={busyAction === `delete-notification-${item.id}`}
                    className="rounded-full border border-accent-2/60 px-3 py-1 text-xs font-semibold text-accent-2 hover:border-accent-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {notifications.length === 0 ? <p className="text-xs text-muted">No notifications yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-black/30 p-5">
        <h2 className="font-heading text-4xl text-paper">Gallery Manager</h2>
        <form className="mt-4 grid gap-3 lg:grid-cols-2" onSubmit={handleAddGalleryImage}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Image URL</span>
            <input
              type="url"
              value={galleryUrl}
              onChange={(event) => setGalleryUrl(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              placeholder="https://..."
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Or Upload File</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1 file:text-black"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Alt Text</span>
            <input
              value={galleryAlt}
              onChange={(event) => setGalleryAlt(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              placeholder="e.g. Dumbbell area at sunrise"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Display Order</span>
            <input
              type="number"
              value={galleryOrder}
              onChange={(event) => setGalleryOrder(event.target.value)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              required
            />
          </label>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={busyAction === "add-gallery"}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black hover:bg-accent/85 disabled:opacity-60"
            >
              {busyAction === "add-gallery" ? "Adding..." : "Add Gallery Image"}
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {gallery.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-line bg-panel/80">
              <img src={item.image_url} alt={item.alt_text || "Gym image"} className="h-44 w-full object-cover" />
              <div className="space-y-2 p-3">
                <p className="text-xs text-muted">{item.alt_text || "No alt text provided."}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={galleryOrderDrafts[item.id] ?? String(item.display_order)}
                    onChange={(event) =>
                      setGalleryOrderDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="w-20 rounded-md border border-line bg-black/30 px-2 py-1 text-xs text-paper"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveGalleryOrder(item.id)}
                    disabled={busyAction === `order-gallery-${item.id}`}
                    className="rounded-full border border-accent/50 px-3 py-1 text-xs font-semibold text-accent hover:border-accent"
                  >
                    Save order
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryImage(item.id)}
                  disabled={busyAction === `delete-gallery-${item.id}`}
                  className="rounded-full border border-accent-2/60 px-3 py-1 text-xs font-semibold text-accent-2 hover:border-accent-2"
                >
                  Delete image
                </button>
              </div>
            </article>
          ))}
          {gallery.length === 0 ? <p className="text-xs text-muted">No gallery images yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
