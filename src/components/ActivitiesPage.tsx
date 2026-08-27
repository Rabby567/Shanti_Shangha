import { activities } from "../data";

interface ActivitiesPageProps {
  onBack: () => void;
  onOpenActivity: (number: string) => void;
}

/**
 * Full activity archive.
 *
 * The home page intentionally shows a compact selection. This page gives
 * visitors a dedicated place to browse every published activity.
 */
export function ActivitiesPage({
  onBack,
  onOpenActivity,
}: ActivitiesPageProps) {
  return (
    <main className="inner-page">
      <section className="inner-page-hero">
        <div className="container">
          <button className="page-back" type="button" onClick={onBack}>
            ← হোমে ফিরে যান
          </button>
          <div className="section-kicker">আমাদের কার্যক্রম</div>
          <h1>আমরা যেভাবে মানুষের পাশে থাকি</h1>
          <p>
            শান্তি সংঘের বিভিন্ন সামাজিক ও মানবিক উদ্যোগের বিস্তারিত তালিকা
            এখানে দেখতে পারবেন।
          </p>
        </div>
      </section>

      <section className="activity-archive">
        <div className="container">
          <div className="activity-archive-grid">
            {activities.map((activity) => (
              <article className="activity-card activity-archive-card" key={activity.number}>
                <div className="activity-image">
                  <img src={activity.image} alt={activity.title} />
                  <span>{activity.number}</span>
                </div>
                <div className="activity-body">
                  <div className="activity-icon" aria-hidden="true">{activity.icon}</div>
                  <h2>{activity.title}</h2>
                  <p>{activity.description}</p>
                  <button
                    className="read-more"
                    type="button"
                    onClick={() => onOpenActivity(activity.number)}
                  >
                    বিস্তারিত পড়ুন <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
