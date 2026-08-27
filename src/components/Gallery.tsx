import { gallery } from "../data";

/**
 * Photo gallery.
 *
 * Demo images can be replaced directly in /public/images/ later.
 */
export function Gallery() {
  return (
    <section id="gallery" className="gallery section-anchor">
      <div className="container">
        <div className="section-heading centered">
          <div className="section-kicker">ফটো গ্যালারি</div>
          <h2>আমাদের কাজের কিছু মুহূর্ত</h2>
          <p>বাস্তব কার্যক্রমের ছবি এখানে সুন্দরভাবে প্রদর্শন করা যাবে।</p>
        </div>

        <div className="gallery-grid">
          {gallery.slice(0, 6).map((item) => (
            <figure key={item.title}>
              <img src={item.image} alt={item.title} />
              <figcaption>{item.title}</figcaption>
            </figure>
          ))}
        </div>

        {/* Keep the homepage gallery compact; the dedicated page contains all photos. */}
        <div className="gallery-more">
          <button
            className="btn primary"
            type="button"
            onClick={() => (window.location.hash = "/gallery")}
          >
            আরও দেখুন <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
