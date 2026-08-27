import type { SectionId } from "../types";

interface HeroProps {
  onNavigate: (sectionId: SectionId) => void;
}

/**
 * Main hero area.
 *
 * The decorative artwork intentionally uses CSS/emoji placeholders so
 * the real illustration can be swapped in later without restructuring
 * the section.
 */
export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-glow glow-a" aria-hidden="true" />
      <div className="hero-glow glow-b" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">❤️ মানবতার পাশে আমরা</div>

          <h1 id="hero-title">
            এসো শান্তি সংঘ করি,
            <br />
            <span>মানবতার সেবা করি</span>
          </h1>

          <p>
            অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র
            বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও
            মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।
          </p>

          <div className="hero-actions">
            <button
              className="btn primary"
              type="button"
              onClick={() => onNavigate("member")}
            >
              সদস্য হোন <span>→</span>
            </button>

            <button
              className="btn blood"
              type="button"
              onClick={() => onNavigate("blood")}
            >
              🩸 রক্তের আবেদন
            </button>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="heart-orbit orbit-1" />
          <div className="heart-orbit orbit-2" />
          <div className="hero-heart">❤</div>
          <div className="hands">👐</div>
        </div>
      </div>
    </section>
  );
}
