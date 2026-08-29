import { navigation } from "../data";
import type { SectionId } from "../types";
import type { SiteSettings } from "../siteSettings";
import { mediaUrl } from "../media";

interface FooterProps {
  onNavigate: (sectionId: SectionId) => void;
  siteSettings?: SiteSettings;
}

/**
 * Site footer and secondary navigation.
 *
 * Keeps the footer branding, navigation actions, and copyright notice
 * in one small, reusable component.
 */
export function Footer({ onNavigate, siteSettings }: FooterProps) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Organization branding */}
        <div className="footer-brand">
          <button
            className="footer-logo footer-logo-button"
            type="button"
            onClick={() => {
              window.location.hash = "";
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="হোমে যান"
          >
            <img
              src={mediaUrl(siteSettings?.logo_path || "/images/logo.svg")}
              alt={siteSettings?.name || "শান্তি সংঘ"}
              className="footer-logo-image"
            />

            <div className="footer-brand-text">
              <strong>{siteSettings?.name || "শান্তি সংঘ"}</strong>
              <small>{siteSettings?.tagline || "যুব সমাজ কল্যাণ পরিষদ"}</small>
            </div>
          </button>

          <p>“এসো শান্তি সংঘ করি, মানবতার সেবা করি”</p>
        </div>

        {/* Primary footer navigation */}
        <div>
          <h4>দ্রুত লিংক</h4>

          {navigation
            .filter((item) => item.id !== "blood")
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
        </div>

        {/* Blood-service shortcuts */}
        <div>
          <h4>রক্ত সেবা</h4>

          <button type="button" onClick={() => onNavigate("blood")}>
            রক্তের আবেদন
          </button>

          <button type="button" onClick={() => onNavigate("blood")}>
            রক্তদাতা হন
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            উপরে যান ↑
          </button>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        © 2026 {siteSettings?.name || "শান্তি সংঘ"} {siteSettings?.tagline || "যুব সমাজ কল্যাণ পরিষদ"} — সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
