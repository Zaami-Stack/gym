export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  created_at: string;
  password_hash: string;
};

export type SiteSettings = {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
};

export type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  created_at: string;
};
