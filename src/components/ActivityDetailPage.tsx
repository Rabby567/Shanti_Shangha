import { activities } from "../data";

interface ActivityDetailPageProps {
  activityNumber: string;
  onBack: () => void;
}

/**
 * Blog-style activity detail page.
 *
 * Content and photographs are driven by the activity data so adding a new
 * activity later does not require duplicating page markup.
 */
export function ActivityDetailPage({
  activityNumber,
  onBack,
}: ActivityDetailPageProps) {
  const activity = activities.find((item) => item.number === activityNumber);

  if (!activity) {
    return (
      <main className="inner-page">
        <section className="detail-page">
          <div className="container detail-empty">
            <h1>কার্যক্রমটি পাওয়া যায়নি</h1>
            <button className="btn primary" type="button" onClick={onBack}>
              কার্যক্রমে ফিরে যান
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="inner-page">
      <article className="detail-page">
        <div className="container detail-container">
          <button className="page-back" type="button" onClick={onBack}>
            ← কার্যক্রমে ফিরে যান
          </button>

          <header className="detail-header">
            <span className="detail-icon" aria-hidden="true">{activity.icon}</span>
            <div>
              <div className="section-kicker">কার্যক্রম {activity.number}</div>
              <h1>{activity.title}</h1>
            </div>
          </header>

          <img
            className="detail-cover"
            src={activity.image}
            alt={activity.title}
          />

          <div className="detail-content">
            <div className="detail-copy">
              <p>{activity.details}</p>
              <p>
                এই উদ্যোগের মাধ্যমে স্বেচ্ছাসেবী কার্যক্রমকে আরও সুসংগঠিত করা,
                মানুষের পাশে দাঁড়ানো এবং সমাজে ইতিবাচক পরিবর্তনে সবাইকে
                অংশগ্রহণে উৎসাহিত করা আমাদের উদ্দেশ্য।
              </p>
            </div>

            <aside className="detail-aside">
              <strong>মানবতার জন্য একসাথে</strong>
              <span>আপনার ছোট একটি সহযোগিতাও বড় পরিবর্তন আনতে পারে।</span>
            </aside>
          </div>

          <section className="detail-gallery" aria-label="কার্যক্রমের ছবি">
            <div className="section-kicker">ছবির গ্যালারি</div>
            <h2>কার্যক্রমের কিছু মুহূর্ত</h2>
            <div className="detail-photo-grid">
              {activity.photos.map((photo, index) => (
                <figure key={photo}>
                  <img src={photo} alt={`${activity.title} - ছবি ${index + 1}`} />
                </figure>
              ))}
            </div>
          </section>
        </div>
      </article>
    </main>
  );
}
