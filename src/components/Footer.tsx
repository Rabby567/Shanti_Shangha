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

        {/* Contact and social links */}
        <div>
          <h4>যোগাযোগ ও সোশ্যাল</h4>
          {siteSettings?.contact_email && <a className="footer-social-link" href={`mailto:${siteSettings.contact_email}`}>✉ ইমেইল</a>}
          {siteSettings?.contact_phone && <a className="footer-social-link" href={`tel:${siteSettings.contact_phone}`}>☎ কল করুন</a>}
          {siteSettings?.facebook_url && <a className="footer-social-link" href={siteSettings.facebook_url} target="_blank" rel="noreferrer">f Facebook</a>}
          {siteSettings?.youtube_url && <a className="footer-social-link" href={siteSettings.youtube_url} target="_blank" rel="noreferrer">▶ YouTube</a>}
          {siteSettings?.instagram_url && <a className="footer-social-link" href={siteSettings.instagram_url} target="_blank" rel="noreferrer">◎ Instagram</a>}
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

        {/* Location map — intentionally kept after the Blood Service column */}
        <div className="footer-location">
          <h4>লোকেশন</h4>
          {(siteSettings?.map_query || siteSettings?.address) ? (
            <iframe
              className="footer-map"
              title="শান্তি সংঘ লোকেশন ম্যাপ"
              loading="lazy"
              src={siteSettings?.map_embed_url || `https://www.google.com/maps?q=${encodeURIComponent(siteSettings?.map_query || siteSettings?.address || "")}&z=${siteSettings?.map_zoom || 15}&output=embed`}
            />
          ) : (
            <div className="footer-map-empty">Admin Dashboard → Settings → Location Map থেকে location সেট করুন।</div>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        © 2026 {siteSettings?.name || "শান্তি সংঘ"} {siteSettings?.tagline || "যুব সমাজ কল্যাণ পরিষদ"} — সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
