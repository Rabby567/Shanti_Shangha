/**
 * Short mission statement displayed directly below the hero.
 */
import { useEffect, useState } from "react";
import { defaultHomepageContent, getHomepageContent, type HomepageContent } from "../homepage";

export function QuoteStrip() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);

  useEffect(() => {
    getHomepageContent().then(setContent);
  }, []);

  return (
    <section className="quote-strip" aria-label="সংগঠনের বার্তা">
      <div className="container quote-inner">
        <div>
          <b>{content.quote_title}</b>
          <span>{content.quote_description}</span>
        </div>

        <span className="quote-mark" aria-hidden="true">
          “
        </span>
      </div>
    </section>
  );
}
