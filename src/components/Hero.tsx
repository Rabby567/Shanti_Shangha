import { useEffect, useState } from "react";
import { defaultHomepageContent, getHomepageContent, type HomepageContent } from "../homepage";
import type { SectionId } from "../types";
import { defaultSettings, getPublicSettings } from "../siteSettings";
import { mediaUrl } from "../media";

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
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [heroImage, setHeroImage] = useState(defaultSettings.homepage.hero_image);

  useEffect(() => {
    Promise.all([getHomepageContent(), getPublicSettings()]).then(([homepage, site]) => {
      setContent({
        ...homepage,
        hero_title_line1: site.homepage.hero_title_line1 || homepage.hero_title_line1,
        hero_title_line2: site.homepage.hero_title_line2 || homepage.hero_title_line2,
        hero_description: site.homepage.hero_subtitle || homepage.hero_description,
      });
      setHeroImage(site.homepage.hero_image);
    });
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-glow glow-a" aria-hidden="true" />
      <div className="hero-glow glow-b" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">{content.hero_eyebrow}</div>

          <h1 id="hero-title">
            {content.hero_title_line1}
            <br />
            <span>{content.hero_title_line2}</span>
          </h1>

          <p>{content.hero_description}</p>

          <div className="hero-actions">
            <button
              className="btn primary"
              type="button"
              onClick={() => onNavigate("member")}
            >
              {content.hero_primary_button} <span>→</span>
            </button>

            <button
              className="btn blood"
              type="button"
              onClick={() => onNavigate("blood")}
            >
              {content.hero_secondary_button}
            </button>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          {heroImage ? (
            <img className="hero-custom-image" src={mediaUrl(heroImage)} alt="" />
          ) : (
            <>
              <div className="heart-orbit orbit-1" />
              <div className="heart-orbit orbit-2" />
              <div className="hero-heart">❤</div>
              <div className="hands">👐</div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
