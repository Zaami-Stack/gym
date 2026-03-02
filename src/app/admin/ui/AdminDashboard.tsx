"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { CustomerTrackerRow, GalleryImage, Notification, SiteSettings } from "@/lib/types";

type Status = {
  tone: "success" | "error";
  message: string;
} | null;

type AdminDashboardProps = {
  adminEmail: string;
  initialSettings: SiteSettings;
  initialGallery: GalleryImage[];
  initialNotifications: Notification[];
  initialCustomers: CustomerTrackerRow[];
};

function sortGallery(images: GalleryImage[]) {
  return [...images].sort((a, b) => a.display_order - b.display_order);
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Request failed.");
  }

  return data as Record<string, unknown>;
}

async function uploadImageFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
    cache: "no-store",
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error((data as { message?: string } | null)?.message || "Failed to upload image.");
  }

  const imageUrl = String((data as { image_url?: string } | null)?.image_url || "");
  if (!imageUrl) {
    throw new Error("Upload finished but no image URL was returned.");
  }
  return imageUrl;
}

export default function AdminDashboard({
  adminEmail,
  initialSettings,
  initialGallery,
  initialNotifications,
  initialCustomers,
}: AdminDashboardProps) {
  const router = useRouter();

  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [gallery, setGallery] = useState<GalleryImage[]>(sortGallery(initialGallery));
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [customers, setCustomers] = useState<CustomerTrackerRow[]>(initialCustomers);
  const [status, setStatus] = useState<Status>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [refreshingCustomers, setRefreshingCustomers] = useState(false);

  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeActive, setNoticeActive] = useState(true);

  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroFileInputKey, setHeroFileInputKey] = useState(0);

  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryFileInputKey, setGalleryFileInputKey] = useState(0);
  const [galleryAlt, setGalleryAlt] = useState("");
  const [galleryOrder, setGalleryOrder] = useState("1");
  const [galleryOrderDrafts, setGalleryOrderDrafts] = useState<Record<string, string>>(
    () =>
      initialGallery.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = String(item.display_order);
        return acc;
      }, {}),
  );
  const [galleryAltDrafts, setGalleryAltDrafts] = useState<Record<string, string>>(
    () =>
      initialGallery.reduce<Record<string, string>>((acc, item) => {
        acc[item.id] = item.alt_text || "";
        return acc;
      }, {}),
  );
  const [galleryReplaceFiles, setGalleryReplaceFiles] = useState<Record<string, File | null>>({});
  const [galleryReplaceInputKeys, setGalleryReplaceInputKeys] = useState<Record<string, number>>({});

  async function handleSaveHero(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("save-hero");
    setStatus(null);

    try {
      let heroImageUrl = settings.hero_image_url.trim();
      if (heroFile) {
        heroImageUrl = await uploadImageFile(heroFile);
      }
      if (!heroImageUrl) {
        throw new Error("Provide a hero image URL or upload an image file.");
      }

      const data = await requestJson("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          hero_title: settings.hero_title.trim(),
          hero_subtitle: settings.hero_subtitle.trim(),
          hero_image_url: heroImageUrl,
        }),
      });

      const nextSettings = data.settings as SiteSettings;
      setSettings(nextSettings);
      setHeroFile(null);
      setHeroFileInputKey((current) => current + 1);
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
      const data = await requestJson("/api/admin/notifications", {
        method: "POST",
        body: JSON.stringify({
          message: noticeMessage.trim(),
          is_active: noticeActive,
        }),
      });

      const row = data.notification as Notification;
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
      await requestJson("/api/admin/notifications", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          is_active: nextValue,
        }),
      });

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
      await requestJson(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

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
      if (!galleryFile) {
        throw new Error("Select an image file.");
      }
      const imageUrl = await uploadImageFile(galleryFile);

      const orderValue = Number.parseInt(galleryOrder, 10);
      if (!Number.isFinite(orderValue)) {
        throw new Error("Display order must be a valid number.");
      }

      const data = await requestJson("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({
          image_url: imageUrl,
          alt_text: galleryAlt.trim(),
          display_order: orderValue,
        }),
      });

      const row = data.image as GalleryImage;
      setGallery((current) => sortGallery([...current, row]));
      setGalleryOrderDrafts((current) => ({
        ...current,
        [row.id]: String(row.display_order),
      }));
      setGalleryAltDrafts((current) => ({
        ...current,
        [row.id]: row.alt_text || "",
      }));
      setGalleryFile(null);
      setGalleryFileInputKey((current) => current + 1);
      setGalleryAlt("");
      setGalleryOrder(String(orderValue + 1));
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
      await requestJson(`/api/admin/gallery?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setGallery((current) => current.filter((item) => item.id !== id));
      setGalleryOrderDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setGalleryAltDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setGalleryReplaceFiles((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setGalleryReplaceInputKeys((current) => {
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

  async function handleSaveGalleryDetails(id: string) {
    setBusyAction(`save-gallery-${id}`);
    setStatus(null);

    try {
      const draft = galleryOrderDrafts[id];
      const nextOrder = Number.parseInt(draft, 10);
      if (!Number.isFinite(nextOrder)) {
        throw new Error("Order must be a valid number.");
      }

      const data = await requestJson("/api/admin/gallery", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          display_order: nextOrder,
          alt_text: (galleryAltDrafts[id] || "").trim(),
        }),
      });

      const updatedImage = data.image as GalleryImage;
      setGallery((current) => sortGallery(current.map((item) => (item.id === id ? updatedImage : item))));
      setGalleryOrderDrafts((current) => ({
        ...current,
        [id]: String(updatedImage.display_order),
      }));
      setGalleryAltDrafts((current) => ({
        ...current,
        [id]: updatedImage.alt_text || "",
      }));
      setStatus({ tone: "success", message: "Gallery image updated." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update gallery image.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleReplaceGalleryImage(id: string) {
    setBusyAction(`replace-gallery-${id}`);
    setStatus(null);

    try {
      const file = galleryReplaceFiles[id];
      if (!file) {
        throw new Error("Select a replacement image first.");
      }

      const imageUrl = await uploadImageFile(file);
      const data = await requestJson("/api/admin/gallery", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          image_url: imageUrl,
        }),
      });

      const updatedImage = data.image as GalleryImage;
      setGallery((current) => sortGallery(current.map((item) => (item.id === id ? updatedImage : item))));
      setGalleryReplaceFiles((current) => ({
        ...current,
        [id]: null,
      }));
      setGalleryReplaceInputKeys((current) => ({
        ...current,
        [id]: (current[id] ?? 0) + 1,
      }));
      setStatus({ tone: "success", message: "Gallery image replaced." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to replace gallery image.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignOut() {
    setBusyAction("signout");
    setStatus(null);

    try {
      await requestJson("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out.";
      setStatus({ tone: "error", message });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRefreshCustomers() {
    setRefreshingCustomers(true);
    setStatus(null);

    try {
      const data = await requestJson("/api/admin/customers");
      const rows = (data.customers as CustomerTrackerRow[] | undefined) ?? [];
      setCustomers(rows);
      setStatus({ tone: "success", message: "Customer tracker refreshed." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh customers.";
      setStatus({ tone: "error", message });
    } finally {
      setRefreshingCustomers(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-3 py-5 md:px-8 md:py-8">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-line bg-panel/75 p-4 md:p-6">
        <div>
          <p className="font-heading text-3xl text-accent sm:text-4xl md:text-5xl">ESPACE FITNESS SM Dashboard</p>
          <p className="mt-1 text-sm text-muted">Signed in as {adminEmail}</p>
          <p className="mt-1 text-xs text-muted">Use this dashboard to control the live gym website content.</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            href="/"
            className="rounded-full border border-line px-4 py-2 text-sm text-paper transition hover:border-accent"
          >
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
              : "border-accent/45 bg-accent/12 text-accent"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <section className="mt-6 rounded-2xl border border-line bg-black/30 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-3xl text-paper md:text-4xl">Customer Tracker</h2>
          <button
            type="button"
            onClick={handleRefreshCustomers}
            disabled={refreshingCustomers}
            className="rounded-full border border-accent-2/70 px-4 py-2 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/10 disabled:opacity-60"
          >
            {refreshingCustomers ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {customers.map((customer) => (
            <article key={customer.id} className="rounded-xl border border-line bg-panel/70 p-3">
              <p className="text-sm font-semibold text-paper">{customer.name}</p>
              <p className="mt-1 text-xs text-muted">{customer.email}</p>
              <p className="mt-1 text-xs text-accent-2">{customer.phone || "-"}</p>
            </article>
          ))}
          {customers.length === 0 ? <p className="text-xs text-muted">No customers signed up yet.</p> : null}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Phone</th>
                <th className="px-2 py-2">Signed At</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-line/60 last:border-b-0">
                  <td className="px-2 py-2 font-semibold text-paper">{customer.name}</td>
                  <td className="px-2 py-2 text-muted">{customer.email}</td>
                  <td className="px-2 py-2 text-accent-2">{customer.phone || "-"}</td>
                  <td className="px-2 py-2 text-muted">{new Date(customer.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {customers.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-xs text-muted" colSpan={4}>
                    No customers signed up yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <article className="rounded-2xl border border-line bg-black/30 p-4 md:p-5">
          <h2 className="font-heading text-3xl text-paper md:text-4xl">Hero Section</h2>
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
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Or Upload Hero Image</span>
              <input
                key={heroFileInputKey}
                type="file"
                accept="image/*"
                onChange={(event) => setHeroFile(event.target.files?.[0] || null)}
                className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busyAction === "save-hero"}
              className="w-full rounded-full bg-accent-2 px-5 py-2 text-sm font-semibold text-paper hover:bg-accent-2/85 disabled:opacity-60 sm:w-auto"
            >
              {busyAction === "save-hero" ? "Saving..." : "Save Hero Section"}
            </button>
          </form>
        </article>

        <article className="rounded-2xl border border-line bg-black/30 p-4 md:p-5">
          <h2 className="font-heading text-3xl text-paper md:text-4xl">Notifications</h2>
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
              className="w-full rounded-full bg-accent-2 px-5 py-2 text-sm font-semibold text-paper hover:bg-accent-2/85 disabled:opacity-60 sm:w-auto"
            >
              {busyAction === "add-notification" ? "Adding..." : "Add Notification"}
            </button>
          </form>
          <div className="mt-5 space-y-2">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-panel/80 p-3">
                <p className="text-sm text-paper">{item.message}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleNotification(item.id, !item.is_active)}
                    disabled={busyAction === `toggle-notification-${item.id}`}
                    className={`rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${
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
                    className="rounded-full border border-accent-2/60 px-3 py-1 text-xs font-semibold text-accent-2 hover:border-accent-2 sm:text-sm"
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

      <section className="mt-6 rounded-2xl border border-line bg-black/30 p-4 md:p-5">
        <h2 className="font-heading text-3xl text-paper md:text-4xl">Gallery Manager</h2>
        <form className="mt-4 grid gap-3 lg:grid-cols-2" onSubmit={handleAddGalleryImage}>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Upload Image</span>
            <input
              key={galleryFileInputKey}
              type="file"
              accept="image/*"
              onChange={(event) => setGalleryFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-paper outline-none focus:border-accent"
              required
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
          <label className="block lg:col-span-2">
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
              className="w-full rounded-full bg-accent-2 px-5 py-2 text-sm font-semibold text-paper hover:bg-accent-2/85 disabled:opacity-60 sm:w-auto"
            >
              {busyAction === "add-gallery" ? "Adding..." : "Add Gallery Image"}
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {gallery.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-line bg-panel/80">
              <img src={item.image_url} alt={item.alt_text || "Gym image"} className="h-44 w-full object-cover" />
              <div className="space-y-3 p-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">Alt Text</span>
                  <input
                    value={galleryAltDrafts[item.id] ?? item.alt_text ?? ""}
                    onChange={(event) =>
                      setGalleryAltDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-line bg-black/30 px-2 py-1 text-xs text-paper sm:text-sm"
                    placeholder="Describe this image"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={galleryOrderDrafts[item.id] ?? String(item.display_order)}
                    onChange={(event) =>
                      setGalleryOrderDrafts((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="w-20 rounded-md border border-line bg-black/30 px-2 py-1 text-xs text-paper sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveGalleryDetails(item.id)}
                    disabled={busyAction === `save-gallery-${item.id}`}
                    className="rounded-full border border-accent/50 px-3 py-1 text-xs font-semibold text-accent hover:border-accent sm:text-sm"
                  >
                    {busyAction === `save-gallery-${item.id}` ? "Saving..." : "Save details"}
                  </button>
                </div>
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted">Replace Image</span>
                  <input
                    key={`${item.id}-${galleryReplaceInputKeys[item.id] ?? 0}`}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setGalleryReplaceFiles((current) => ({
                        ...current,
                        [item.id]: event.target.files?.[0] || null,
                      }))
                    }
                    className="w-full rounded-md border border-line bg-black/30 px-2 py-1 text-xs text-paper sm:text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReplaceGalleryImage(item.id)}
                    disabled={busyAction === `replace-gallery-${item.id}`}
                    className="rounded-full border border-accent/50 px-3 py-1 text-xs font-semibold text-accent hover:border-accent sm:text-sm"
                  >
                    {busyAction === `replace-gallery-${item.id}` ? "Replacing..." : "Replace image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryImage(item.id)}
                    disabled={busyAction === `delete-gallery-${item.id}`}
                    className="rounded-full border border-accent-2/60 px-3 py-1 text-xs font-semibold text-accent-2 hover:border-accent-2 sm:text-sm"
                  >
                    Delete image
                  </button>
                </div>
              </div>
            </article>
          ))}
          {gallery.length === 0 ? <p className="text-xs text-muted">No gallery images yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
