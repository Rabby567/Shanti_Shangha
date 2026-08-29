import { useEffect, useMemo, useState } from "react";
import { ImagePicker } from "./ImagePicker";
import { mediaUrl } from "../media";

type ActivityRecord = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  event_date: string | null;
  location: string;
  cover_image: string;
  is_published: boolean;
  sort_order: number;
  videos: Array<{
    id: number;
    title: string;
    youtube_url: string;
    sort_order: number;
  }>;
  photos: Array<{
    id: number;
    file_path: string;
    caption: string;
    sort_order: number;
  }>;
};

type ActivityForm = {
  id?: number;
  title: string;
  short_description: string;
  description: string;
  event_date: string;
  location: string;
  cover_image: string;
  is_published: boolean;
  sort_order: number;
  photos: string;
  videos: Array<{ title: string; youtube_url: string }>;
};

const emptyForm: ActivityForm = {
  title: "",
  short_description: "",
  description: "",
  event_date: "",
  location: "",
  cover_image: "/images/activity-1.svg",
  is_published: true,
  sort_order: 0,
  photos: "",
  videos: [],
};

function recordToForm(activity: ActivityRecord): ActivityForm {
  return {
    id: activity.id,
    title: activity.title,
    short_description: activity.short_description,
    description: activity.description,
    event_date: activity.event_date || "",
    location: activity.location,
    cover_image: activity.cover_image,
    is_published: activity.is_published,
    sort_order: activity.sort_order,
    photos: activity.photos.map((photo) => photo.file_path).join("\n"),
    videos: activity.videos.map((video) => ({ title: video.title, youtube_url: video.youtube_url })),
  };
}

function formToPayload(form: ActivityForm) {
  return {
    ...(form.id ? { id: form.id } : {}),
    title: form.title,
    short_description: form.short_description,
    description: form.description,
    event_date: form.event_date,
    location: form.location,
    cover_image: form.cover_image,
    is_published: form.is_published,
    sort_order: form.sort_order,
    photos: form.photos
      .split("\n")
      .map((path) => path.trim())
      .filter(Boolean),
    videos: form.videos.filter((video) => video.youtube_url.trim()).map((video) => ({ title: video.title.trim(), youtube_url: video.youtube_url.trim() })),
  };
}

export function ActivitiesManagement() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [form, setForm] = useState<ActivityForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isEditing = useMemo(() => Boolean(form.id), [form.id]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/activities.php?action=admin-list", {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "কার্যক্রম লোড করা যায়নি।");
      }

      setActivities(data.activities);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "কার্যক্রম লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const updateField = <K extends keyof ActivityForm>(key: K, value: ActivityForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };
  const updateVideo = (index: number, key: "title" | "youtube_url", value: string) => {
    setForm((current) => ({
      ...current,
      videos: current.videos.map((video, i) => i === index ? { ...video, [key]: value } : video),
    }));
    setMessage("");
    setError("");
  };

  const addVideo = () => {
    setForm((current) => ({ ...current, videos: [...current.videos, { title: "", youtube_url: "" }] }));
  };

  const removeVideo = (index: number) => {
    setForm((current) => ({ ...current, videos: current.videos.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("কার্যক্রমের নাম দিতে হবে।");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const action = isEditing ? "update" : "create";
      const response = await fetch(`/api/activities.php?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "সংরক্ষণ করা যায়নি।");
      }

      setMessage(data.message);
      resetForm();
      await loadActivities();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("এই কার্যক্রমটি স্থায়ীভাবে মুছে ফেলতে চান?")) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch("/api/activities.php?action=delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "মুছে ফেলা যায়নি।");
      }

      setMessage(data.message);
      if (form.id === id) resetForm();
      await loadActivities();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "মুছে ফেলা যায়নি।");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-activities-module">
      <div className="admin-module-header">
        <div>
          <span className="admin-kicker">CONTENT MANAGEMENT</span>
          <h1>কার্যক্রম পরিচালনা</h1>
          <p>নতুন কার্যক্রম যোগ করুন এবং প্রকাশিত কার্যক্রম সম্পাদনা করুন।</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={resetForm}>
          ＋ নতুন কার্যক্রম
        </button>
      </div>

      {message && <div className="admin-success-notice">✓ {message}</div>}
      {error && <div className="admin-data-notice">{error}</div>}

      <div className="admin-activities-layout">
        <div className="admin-form-card">
          <div className="admin-form-section-heading">
            <span className="admin-kicker">{isEditing ? "EDIT ACTIVITY" : "NEW ACTIVITY"}</span>
            <h2>{isEditing ? "কার্যক্রম সম্পাদনা" : "নতুন কার্যক্রম যোগ করুন"}</h2>
          </div>

          <div className="admin-form-grid">
            <label className="full">
              <span>কার্যক্রমের নাম *</span>
              <input value={form.title} onChange={(e) => updateField("title", e.target.value)} />
            </label>

            <label className="full">
              <span>সংক্ষিপ্ত description</span>
              <textarea rows={3} value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} />
            </label>

            <label className="full">
              <span>বিস্তারিত description</span>
              <textarea rows={7} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
            </label>

            <label>
              <span>তারিখ</span>
              <input type="date" value={form.event_date} onChange={(e) => updateField("event_date", e.target.value)} />
            </label>

            <label>
              <span>স্থান</span>
              <input value={form.location} onChange={(e) => updateField("location", e.target.value)} />
            </label>

            <div className="full">
              <ImagePicker
                value={form.cover_image}
                onChange={(value) => updateField("cover_image", value)}
                label="Cover Image"
                help="দুটি option থাকবে: Gallery থেকে image নির্বাচন অথবা Device থেকে নতুন image upload।"
              />
            </div>

            <label className="full">
              <span>কার্যক্রমের ছবি — প্রতি লাইনে একটি path/URL</span>
              <textarea
                rows={5}
                value={form.photos}
                onChange={(e) => updateField("photos", e.target.value)}
                placeholder={"/uploads/activities/photo-1.jpg\n/uploads/activities/photo-2.jpg"}
              />
            </label>
            <div className="full activity-video-admin-block">
              <div className="activity-video-admin-heading">
                <div><span>কার্যক্রমের YouTube ভিডিও</span><small>শুধু YouTube link দিন। Public website-এ thumbnail-এ click করলে video play হবে।</small></div>
                <button type="button" className="admin-secondary-button" onClick={addVideo}>＋ ভিডিও যোগ করুন</button>
              </div>
              {form.videos.length === 0 ? (
                <div className="admin-list-empty">এখনও কোনো ভিডিও যোগ করা হয়নি।</div>
              ) : (
                <div className="activity-video-admin-list">
                  {form.videos.map((video, index) => (
                    <div className="activity-video-admin-row" key={index}>
                      <div>
                        <label><span>ভিডিওর নাম</span><input value={video.title} onChange={(e) => updateVideo(index, "title", e.target.value)} placeholder="যেমন: বৃক্ষরোপণ কর্মসূচি" /></label>
                        <label><span>YouTube URL *</span><input type="url" value={video.youtube_url} onChange={(e) => updateVideo(index, "youtube_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
                      </div>
                      <button type="button" className="admin-danger-light" onClick={() => removeVideo(index)}>সরান</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label>
              <span>ক্রম</span>
              <input type="number" min="0" value={form.sort_order} onChange={(e) => updateField("sort_order", Number(e.target.value))} />
            </label>

            <label className="admin-checkbox-field">
              <input type="checkbox" checked={form.is_published} onChange={(e) => updateField("is_published", e.target.checked)} />
              <span>Public website-এ প্রকাশিত থাকবে</span>
            </label>
          </div>

          <div className="admin-form-actions">
            {isEditing && (
              <button type="button" className="admin-secondary-button" onClick={resetForm}>
                বাতিল
              </button>
            )}
            <button type="button" className="admin-primary-button" disabled={saving} onClick={handleSave}>
              {saving ? "সংরক্ষণ হচ্ছে..." : isEditing ? "পরিবর্তন সংরক্ষণ করুন" : "কার্যক্রম যোগ করুন"}
            </button>
          </div>
        </div>

        <div className="admin-form-card admin-activity-list-card">
          <div className="admin-form-section-heading">
            <span className="admin-kicker">ACTIVITY LIST</span>
            <h2>সব কার্যক্রম</h2>
          </div>

          {loading ? (
            <div className="admin-list-empty">কার্যক্রম লোড হচ্ছে...</div>
          ) : activities.length === 0 ? (
            <div className="admin-list-empty">এখনও কোনো কার্যক্রম যোগ করা হয়নি।</div>
          ) : (
            <div className="admin-activity-list">
              {activities.map((activity) => (
                <article className="admin-activity-item" key={activity.id}>
                  <img src={mediaUrl(activity.cover_image || "/images/activity-1.svg")} alt="" />
                  <div className="admin-activity-item-content">
                    <div className="admin-activity-item-top">
                      <strong>{activity.title}</strong>
                      <span className={activity.is_published ? "is-published" : "is-draft"}>
                        {activity.is_published ? "প্রকাশিত" : "Draft"}
                      </span>
                    </div>
                    <p>{activity.short_description || "কোনো সংক্ষিপ্ত description নেই।"}</p>
                    <small>
                      {activity.event_date || "তারিখ নেই"} {activity.location ? `• ${activity.location}` : ""}
                    </small>
                    <div className="admin-activity-actions">
                      <button type="button" onClick={() => setForm(recordToForm(activity))}>সম্পাদনা</button>
                      <button type="button" className="danger" disabled={deletingId === activity.id} onClick={() => handleDelete(activity.id)}>
                        {deletingId === activity.id ? "মুছছে..." : "মুছে ফেলুন"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
