import { useEffect, useState } from "react";
import { activities as fallbackActivities } from "../data";
import { getPublicActivities } from "../activities";
import type { Activity } from "../types";
import { mediaUrl } from "../media";

interface ActivitiesProps {
  onOpenActivities: () => void;
}

export function Activities({ onOpenActivities }: ActivitiesProps) {
  const [activities, setActivities] = useState<Activity[]>(fallbackActivities);

  useEffect(() => {
    let cancelled = false;

    getPublicActivities()
      .then((items) => {
        if (!cancelled && items.length > 0) setActivities(items);
      })
      .catch(() => {
        // Keep the local demo content if the API is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="activities" className="activities section-anchor">
      <div className="container">
        <div className="section-heading centered">
          <div className="section-kicker">আমাদের কার্যক্রম</div>
          <h2>যে কাজগুলো আমাদের পথচলাকে এগিয়ে নেয়</h2>
          <p>মানুষের কল্যাণ ও সামাজিক সচেতনতার জন্য আমাদের বিভিন্ন উদ্যোগ।</p>
        </div>

        <div className="activity-grid">
          {activities.slice(0, 3).map((activity) => (
            <article className="activity-card" key={activity.id ?? activity.number}>
              <div className="activity-image">
                <img src={mediaUrl(activity.image)} alt={activity.title} />
                <span>{activity.number}</span>
              </div>
              <div className="activity-body">
                <div className="activity-icon" aria-hidden="true">{activity.icon}</div>
                <h3>{activity.title}</h3>
                <p>{activity.description}</p>
                <button
                  className="read-more"
                  type="button"
                  onClick={() => {
                    const key = activity.id ? String(activity.id) : activity.number;
                    window.location.hash = `/activity/${encodeURIComponent(key)}`;
                  }}
                >
                  আরও পড়ুন <span aria-hidden="true">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="activities-more">
          <button className="btn primary" type="button" onClick={onOpenActivities}>
            আরও দেখুন <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
