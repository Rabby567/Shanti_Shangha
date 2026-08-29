import { useEffect, useState } from "react";
import { defaultHomepageContent, getHomepageContent, type HomepageContent } from "../homepage";
import { statistics } from "../data";
import { AnimatedStat } from "./AnimatedStat";
import { defaultSettings, getPublicSettings } from "../siteSettings";

/**
 * About section.
 *
 * The left content column and right statistics column are intentionally
 * equal-width on desktop to match the reference layout.
 */
export function About() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [statisticsEnabled, setStatisticsEnabled] = useState(defaultSettings.homepage.statistics_enabled);

  useEffect(() => {
    Promise.all([getHomepageContent(), getPublicSettings()]).then(([data, site]) => {
      setContent(data);
      setStatisticsEnabled(site.homepage.statistics_enabled);
    });
  }, []);

  const dynamicStatistics = [
    { value: content.stat_1_value, label: content.stat_1_label },
    { value: content.stat_2_value, label: content.stat_2_label },
    { value: content.stat_3_value, label: content.stat_3_label },
    { value: content.stat_4_value, label: content.stat_4_label },
  ];

  return (
    <section id="about" className="about section-anchor">
      <div className="container">
        <div className="about-grid">
          <div className="about-copy">
            <div className="section-kicker">{content.about_kicker}</div>

            <h2>{content.about_title}</h2>

            <p>{content.about_paragraph1}</p>

            <p>{content.about_paragraph2}</p>

            <div className="about-quote">{content.about_quote}</div>

            <button
              className="read-more"
              type="button"
              onClick={() => (window.location.hash = "/about")}
            >
              আরও পড়ুন <span aria-hidden="true">→</span>
            </button>
          </div>

          {statisticsEnabled && <div className="stats" aria-label="সংগঠনের পরিসংখ্যান">
            {dynamicStatistics.map((stat) => (
              <AnimatedStat key={stat.label} stat={stat} />
            ))}
          </div>}
        </div>
      </div>
    </section>
  );
}
