import { gallery } from "../data";

/**
 * Dedicated gallery page.
 *
 * The homepage shows a compact preview; this page is the complete
 * gallery destination used by the main navigation and "See more" link.
 */
interface GalleryPageProps {
  onBack: () => void;
}

export function GalleryPage({ onBack }: GalleryPageProps) {
  return (
    <main className="inner-page">
      <section className="inner-page-hero">
        <div className="container">
          <button className="page-back" type="button" onClick={onBack}>
            ← হোমে ফিরে যান
          </button>
          <div className="section-kicker">ফটো গ্যালারি</div>
          <h1>আমাদের কাজের কিছু মুহূর্ত</h1>
          <p>
            শান্তি সংঘের বিভিন্ন সামাজিক ও মানবিক কার্যক্রমের ছবিগুলো
            এখানে একসাথে দেখতে পারবেন।
          </p>
        </div>
      </section>

      <section className="gallery-page-content">
        <div className="container">
          <div className="gallery-page-grid">
            {gallery.map((item, index) => (
              <figure key={`${item.title}-${index}`}>
                <div className="gallery-page-image">
                  <img src={item.image} alt={item.title} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <figcaption>{item.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
