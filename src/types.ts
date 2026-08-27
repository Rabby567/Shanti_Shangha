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
  | "blood";

export interface Activity {
  number: string;
  icon: string;
  title: string;
  description: string;
  image: string;
  /** Extended content used on the activity detail/blog page. */
  details: string;
  photos: string[];
}

export interface GalleryItem {
  title: string;
  image: string;
}

export interface Stat {
  value: string;
  label: string;
}
