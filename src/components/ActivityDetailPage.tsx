import { useEffect, useState } from "react";
import { activities as fallbackActivities } from "../data";
import type { Activity } from "../types";
import { mediaUrl } from "../media";

function getYoutubeId(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtu.be")) return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (host.includes("youtube.com") || host.includes("youtube-nocookie.com")) {
      return parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).slice(-1)[0] || "";
    }
  } catch {}
  return "";
}

interface ActivityDetailPageProps {
  activityNumber: string;
  onBack: () => void;
}

export function ActivityDetailPage({ activityNumber, onBack }: ActivityDetailPageProps) {
  const fallback = fallbackActivities.find(
    (item) => item.number === activityNumber || String(item.id ?? "") === activityNumber,
  );
  const [activity, setActivity] = useState<Activity | null>(fallback ?? null);
  const [loading, setLoading] = useState(!fallback);
  const [playingVideo, setPlayingVideo] = useState<{title:string; id:string} | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/activities.php?action=one&id=${encodeURIComponent(activityNumber)}`, {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Not found");
        return data.activity;
      })
      .then((item) => {
        if (!cancelled) {
          setActivity({
            id: item.id,
            number: String(item.sort_order || item.id).padStart(2, "0"),
            icon: "🤝",
            title: item.title,
            description: item.short_description,
            image: item.cover_image || "/images/activity-1.svg",
            details: item.description,
            photos: item.photos.map((photo: { file_path: string }) => photo.file_path),
            videos: (item.videos || []).map((video: { title: string; youtube_url: string }) => ({ title: video.title, youtube_url: video.youtube_url })),
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activityNumber]);

  if (loading && !activity) {
    return (
      <main className="inner-page">
        <section className="detail-page">
          <div className="container detail-empty"><h1>কার্যক্রম লোড হচ্ছে...</h1></div>
        </section>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="inner-page">
        <section className="detail-page">
          <div className="container detail-empty">
            <h1>কার্যক্রমটি পাওয়া যায়নি</h1>
            <button className="btn primary" type="button" onClick={onBack}>কার্যক্রমে ফিরে যান</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="inner-page">
      <article className="detail-page">
        <div className="container detail-container">
          <button className="page-back" type="button" onClick={onBack}>← কার্যক্রমে ফিরে যান</button>

          <header className="detail-header">
            <span className="detail-icon" aria-hidden="true">{activity.icon}</span>
            <div>
              <div className="section-kicker">কার্যক্রম {activity.number}</div>
              <h1>{activity.title}</h1>
            </div>
          </header>

          <img className="detail-cover" src={mediaUrl(activity.image)} alt={activity.title} />

          <div className="detail-content">
            <div className="detail-copy">
              <p>{activity.details}</p>
            </div>
            <aside className="detail-aside">
              <strong>মানবতার জন্য একসাথে</strong>
              <span>আপনার ছোট একটি সহযোগিতাও বড় পরিবর্তন আনতে পারে।</span>
            </aside>
          </div>

          {activity.photos.length > 0 && (
            <section className="detail-gallery" aria-label="কার্যক্রমের ছবি">
              <div className="section-kicker">ছবির গ্যালারি</div>
              <h2>কার্যক্রমের কিছু মুহূর্ত</h2>
              <div className="detail-photo-grid">
                {activity.photos.map((photo, index) => (
                  <figure key={`${photo}-${index}`}>
                    <img src={mediaUrl(photo)} alt={`${activity.title} - ছবি ${index + 1}`} />
                  </figure>
                ))}
              </div>
            </section>
          )}
          {!!activity.videos?.length && (
            <section className="detail-videos" aria-label="কার্যক্রমের ভিডিও">
              <div className="section-kicker">ভিডিও</div>
              <h2>কার্যক্রমের ভিডিও</h2>
              <div className="detail-video-grid">
                {activity.videos.map((video, index) => {
                  const id = getYoutubeId(video.youtube_url);
                  if (!id) return null;
                  return (
                    <button className="detail-video-card" type="button" key={`${video.youtube_url}-${index}`} onClick={() => setPlayingVideo({ title: video.title || "YouTube ভিডিও", id })}>
                      <img src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`} alt="" />
                      <span className="detail-video-play">▶</span>
                      <strong>{video.title || `ভিডিও ${index + 1}`}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </article>

      {playingVideo && (
        <div className="video-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setPlayingVideo(null); }}>
          <div className="video-modal" role="dialog" aria-modal="true" aria-label={playingVideo.title}>
            <button className="video-modal-close" type="button" onClick={() => setPlayingVideo(null)}>×</button>
            <div className="video-modal-frame">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
