/**
 * Shared application types.
 *
 * Keeping reusable shapes here prevents components from duplicating
 * inline tuple/object definitions and makes future API integration easier.
 */

export interface NavItem {
  id: SectionId;
  label: string;
}

export type SectionId =
  | "about"
  | "activities"
  | "gallery"
  | "member"
  | "blood"
  | "donation";

export interface Activity {
  id?: number;
  number: string;
  icon: string;
  title: string;
  description: string;
  image: string;
  /** Extended content used on the activity detail/blog page. */
  details: string;
  photos: string[];
  videos?: Array<{ title: string; youtube_url: string }>;
}

export interface GalleryItem {
  title: string;
  image: string;
}

export interface Stat {
  value: string;
  label: string;
}


export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar_path: string | null;
  role: "super_admin" | "admin";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}
