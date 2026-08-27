import { navigation } from "../data";
import type { SectionId } from "../types";

interface HeaderProps {
  mobileMenuOpen: boolean;
  onMenuToggle: () => void;
  onNavigate: (sectionId: SectionId) => void;
}

/**
 * Sticky site header with responsive desktop/mobile navigation.
 */
export function Header({
  mobileMenuOpen,
  onMenuToggle,
  onNavigate,
}: HeaderProps) {
  const goHome = () => {
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
            src="/images/logo.svg"
            alt="শান্তি সংঘ"
          />

          <span className="brand-text">
            <strong>শান্তি সংঘ</strong>
            <small>যুব সমাজ কল্যাণ পরিষদ</small>
          </span>
        </button>

        <nav className="desktop-nav" aria-label="প্রধান নেভিগেশন">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

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
        </nav>
      )}
    </header>
  );
}
