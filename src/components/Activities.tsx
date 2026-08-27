import { activities } from "../data";

/**
 * Activity cards section.
 */
export function Activities() {
  return (
    <section id="activities" className="activities section-anchor">
      <div className="container">
        <div className="section-heading centered">
          <div className="section-kicker">আমাদের কার্যক্রম</div>
          <h2>আমরা যেভাবে মানুষের পাশে থাকি</h2>
          <p>
            আমাদের বিভিন্ন সামাজিক ও মানবিক কার্যক্রমের কিছু অংশ নিচে তুলে
            ধরা হলো।
          </p>
        </div>

        <div className="activity-grid">
          {activities.map((activity) => (
            <article className="activity-card" key={activity.number}>
              <div className="activity-image">
                <img src={activity.image} alt={activity.title} />
                <span>{activity.number}</span>
              </div>

              <div className="activity-body">
                <div className="activity-icon" aria-hidden="true">
                  {activity.icon}
                </div>

                <h3>{activity.title}</h3>
                <p>
                  {activity.description}{" "}
                  <button
                    className="read-more-inline"
                    type="button"
                    onClick={() =>
                      (window.location.hash = `/activity/${encodeURIComponent(
                        activity.number,
                      )}`)
                    }
                  >
                    আরও পড়ুন
                  </button>
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* The home page stays compact; the archive contains every activity. */}
        <div className="activities-more">
          <button
            className="btn primary"
            type="button"
            onClick={() => (window.location.hash = "/activities")}
          >
            আরও দেখুন <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
