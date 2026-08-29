import { useCallback, useEffect, useState } from "react";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLogin } from "./components/AdminLogin";
import { About } from "./components/About";
import { AboutPage } from "./components/AboutPage";
import { Activities } from "./components/Activities";
import { ActivitiesPage } from "./components/ActivitiesPage";
import { ActivityDetailPage } from "./components/ActivityDetailPage";
import { BloodService } from "./components/BloodService";
import { DonationSection } from "./components/DonationSection";
import { ContactSection } from "./components/ContactSection";
import { Footer } from "./components/Footer";
import { Gallery } from "./components/Gallery";
import { GalleryPage } from "./components/GalleryPage";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MemberRegistration } from "./components/MemberRegistration";
import { QuoteStrip } from "./components/QuoteStrip";
import type { SectionId } from "./types";
import { defaultSettings, getPublicSettings, type SiteSettings, type HomepageSettings } from "./siteSettings";
import { mediaUrl } from "./media";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [route, setRoute] = useState(window.location.hash);
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSettings.site);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(defaultSettings.homepage);

  /**
   * Keep the lightweight hash router synchronized with browser navigation.
   * This gives the site dedicated activity/archive URLs without adding a
   * routing dependency to this small project.
   */
  // Load public site configuration so branding, maintenance mode and homepage
  // visibility controls are applied to the real website.
  useEffect(() => {
    getPublicSettings().then(({ site, homepage }) => {
      setSiteSettings(site);
      setHomepageSettings(homepage);
      document.title = site.name || "শান্তি সংঘ";
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (favicon && site.favicon_path) favicon.href = mediaUrl(site.favicon_path);
    });
  }, []);

  // Verify the server-side admin session whenever the admin route is opened.
  useEffect(() => {
    if (route !== "#/admin") {
      setAdminAuthenticated(null);
      return;
    }

    let cancelled = false;

    fetch("/api/auth.php?action=me", { credentials: "include" })
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled) {
          setAdminAuthenticated(result.success === true && result.authenticated === true);
        }
      })
      .catch(() => {
        if (!cancelled) setAdminAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, [route]);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  /**
   * After returning from an inner page, honor normal section hashes such as
   * "#about" or "#gallery" once the home sections are mounted again.
   */
  useEffect(() => {
    if (!route || route.startsWith("#/")) return;

    const sectionId = route.slice(1);
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }, [route]);

  /**
   * Scroll to a page section and close the mobile menu.
   *
   * Keeping this behavior in one callback prevents every component
   * from implementing its own navigation logic.
   */
  const scrollToSection = useCallback((sectionId: SectionId) => {
    setMobileMenuOpen(false);

    // These sections have dedicated pages instead of only in-page anchors.
    if (sectionId === "about") {
      window.location.hash = "/about";
      return;
    }

    if (sectionId === "activities") {
      window.location.hash = "/activities";
      return;
    }

    if (sectionId === "gallery") {
      window.location.hash = "/gallery";
      return;
    }

    // Remaining navigation items stay as homepage section anchors.
    window.location.hash = `#${sectionId}`;
  }, []);

  /**
   * Display a lightweight success notification after a form submission.
   *
   * This is intentionally UI-only for now. A backend can be connected
   * later without changing the visual form components.
   */
  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 2800);
  }, []);

  const openActivitiesPage = useCallback(() => {
    window.location.hash = "/activities";
  }, []);

  const openActivityDetail = useCallback((activityNumber: string) => {
    window.location.hash = `/activity/${encodeURIComponent(activityNumber)}`;
  }, []);

  const goHome = useCallback(() => {
    setMobileMenuOpen(false);
    window.location.hash = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const activityRouteMatch = route.match(/^#\/activity\/(.+)$/);
  const isAdminPage = route === "#/admin";
  const isMaintenance = siteSettings.status === "maintenance";
  const isAboutPage = route === "#/about";
  const isActivitiesPage = route === "#/activities";
  const isGalleryPage = route === "#/gallery";
  const activityNumber = activityRouteMatch
    ? decodeURIComponent(activityRouteMatch[1])
    : "";

  if (isAdminPage) {
    if (adminAuthenticated === null) {
      return (
        <main className="admin-auth-loading" aria-live="polite">
          <div>ড্যাশবোর্ড প্রস্তুত হচ্ছে...</div>
        </main>
      );
    }

    if (!adminAuthenticated) {
      return (
        <AdminLogin onLogin={() => setAdminAuthenticated(true)} onBackToWebsite={goHome} />
      );
    }

    return (
      <AdminDashboard
        onBackToWebsite={goHome}
        onLogout={() => setAdminAuthenticated(false)}
      />
    );
  }

  if (isMaintenance) {
    return (
      <main className="maintenance-page">
        <div className="maintenance-card">
          <img src={mediaUrl(siteSettings.logo_path || "/images/logo.svg")} alt={siteSettings.name} />
          <span className="eyebrow">MAINTENANCE</span>
          <h1>ওয়েবসাইটটি সাময়িকভাবে বন্ধ আছে</h1>
          <p>{siteSettings.tagline || "শীঘ্রই আবার ফিরে আসছি।"}</p>
          {siteSettings.contact_phone && <a href={`tel:${siteSettings.contact_phone}`}>{siteSettings.contact_phone}</a>}
          {siteSettings.contact_email && <a href={`mailto:${siteSettings.contact_email}`}>{siteSettings.contact_email}</a>}
        </div>
      </main>
    );
  }

  return (
    <div className="site">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen((isOpen) => !isOpen)}
        onNavigate={scrollToSection}
        siteSettings={siteSettings}
      />

      {isAboutPage ? (
        <AboutPage onBack={goHome} />
      ) : isActivitiesPage ? (
        <ActivitiesPage
          onBack={goHome}
          onOpenActivity={openActivityDetail}
        />
      ) : isGalleryPage ? (
        <GalleryPage onBack={goHome} />
      ) : activityRouteMatch ? (
        <ActivityDetailPage
          activityNumber={activityNumber}
          onBack={openActivitiesPage}
        />
      ) : (
        <main>
          <Hero onNavigate={scrollToSection} />
          <QuoteStrip />
          {homepageSettings.about_enabled && <About />}
          {homepageSettings.activities_enabled && <Activities onOpenActivities={openActivitiesPage} />}
          {homepageSettings.gallery_enabled && <Gallery />}
          <MemberRegistration onSubmit={showToast} />
          {homepageSettings.blood_enabled && <BloodService onSubmit={showToast} />}
          <DonationSection onSubmit={showToast} />
          <ContactSection siteSettings={siteSettings} />
        </main>
      )}

      <Footer onNavigate={scrollToSection} siteSettings={siteSettings} />

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          ✓ {toastMessage}
        </div>
      )}

      {siteSettings.contact_phone && (
        <a className="float-call" href={`tel:${siteSettings.contact_phone}`} aria-label={`কল করুন ${siteSettings.contact_phone}`} title={`কল করুন: ${siteSettings.contact_phone}`}>
          ☎
        </a>
      )}
    </div>
  );
}

export default App;
