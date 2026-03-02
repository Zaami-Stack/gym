import type { GalleryImage, SiteSettings } from "@/lib/types";

export const defaultSettings: SiteSettings = {
  id: 1,
  hero_title: "Build Power. Move Better. Stay Consistent.",
  hero_subtitle:
    "Train with elite coaches, premium equipment, and a results-first program built for real progress.",
  hero_image_url:
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80",
  updated_at: new Date(0).toISOString(),
};

export const defaultGallery: GalleryImage[] = [
  {
    id: "sample-1",
    image_url:
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80",
    alt_text: "Strength area with barbells",
    display_order: 1,
    created_at: new Date(0).toISOString(),
  },
  {
    id: "sample-2",
    image_url:
      "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?auto=format&fit=crop&w=1200&q=80",
    alt_text: "Athlete doing battle rope workout",
    display_order: 2,
    created_at: new Date(0).toISOString(),
  },
  {
    id: "sample-3",
    image_url:
      "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=80",
    alt_text: "Group training session",
    display_order: 3,
    created_at: new Date(0).toISOString(),
  },
];
