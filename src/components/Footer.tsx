import { navigation } from "../data";
import type { SectionId } from "../types";

interface FooterProps {
  onNavigate: (sectionId: SectionId) => void;
}

/**
 * Site footer and secondary navigation.
 *
 * Keeps the footer branding, navigation actions, and copyright notice
 * in one small, reusable component.
 */
export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Organization branding */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="/images/logo.svg"
              alt="শান্তি সংঘ"
              className="footer-logo-image"
            />

            <div className="footer-brand-text">
              <strong>শান্তি সংঘ</strong>
              <small>যুব সমাজ কল্যাণ পরিষদ</small>
            </div>
          </div>

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
        © 2026 শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদ — সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
}
