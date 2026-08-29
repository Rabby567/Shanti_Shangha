import type { Activity } from "./types";

const API_URL = "/api/activities.php";

export type ApiActivity = Omit<Activity, "photos"> & {
  id: number;
  slug: string;
  short_description: string;
  description: string;
  event_date: string | null;
  location: string;
  cover_image: string;
  is_published: boolean;
  sort_order: number;
  photos: Array<{
    id: number;
    file_path: string;
    caption: string;
    sort_order: number;
  }>;
};

export const activityFallback: Activity[] = [];

function mapActivity(activity: ApiActivity): Activity {
  return {
    id: activity.id,
    number: String(activity.sort_order || activity.id).padStart(2, "0"),
    icon: "🤝",
    title: activity.title,
    description: activity.short_description,
    image: activity.cover_image || "/images/activity-1.svg",
    details: activity.description,
    photos: activity.photos.map((photo) => photo.file_path),
  };
}

export async function getPublicActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_URL}?action=list`, {
    credentials: "include",
  });
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Activities could not be loaded.");
  }

  return (data.activities as ApiActivity[]).map(mapActivity);
}
