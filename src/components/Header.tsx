import { navigation } from "../data";
import type { SectionId } from "../types";
import type { SiteSettings } from "../siteSettings";
import { mediaUrl } from "../media";

interface HeaderProps {
  mobileMenuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: (sectionId: SectionId) => void;
  siteSettings?: SiteSettings;
}

/**
 * Sticky site header with responsive desktop/mobile navigation.
 */
export function Header({
  mobileMenuOpen,
  onMenuToggle,
  onNavigate,
  siteSettings,
}: HeaderProps) {
  const goHome = () => {
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Only close the mobile menu if it is currently open.
    if (mobileMenuOpen) {
      onMenuToggle();
    }
  };

  return (
    <header className="header">
      <div className="container nav-wrap">
        <button className="brand" type="button" onClick={goHome} aria-label="হোম">
          {/* Official organization logo supplied for the website header. */}
          <img
            className="brand-logo"
            src={mediaUrl(siteSettings?.logo_path || "/images/logo.svg")}
            alt={siteSettings?.name || "শান্তি সংঘ"}
          />

          <span className="brand-text">
            <strong>{siteSettings?.name || "শান্তি সংঘ"}</strong>
            <small>{siteSettings?.tagline || "যুব সমাজ কল্যাণ পরিষদ"}</small>
          </span>
        </button>

        <div className="header-actions">
          <nav className="desktop-nav" aria-label="প্রধান নেভিগেশন">
            {navigation.map((item) => (
              <button key={item.id} type="button" onClick={() => onNavigate(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          {siteSettings?.contact_phone && (
            <a className="header-call-button" href={`tel:${siteSettings.contact_phone}`}>
              ☎ <span>কল করুন</span>
            </a>
          )}
        </div>

        <button
          className="menu-btn"
          type="button"
          onClick={onMenuToggle}
          aria-label={mobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="মোবাইল নেভিগেশন">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
          {siteSettings?.contact_phone && <a className="mobile-call-button" href={`tel:${siteSettings.contact_phone}`}>☎ কল করুন</a>}
        </nav>
      )}
    </header>
  );
}
