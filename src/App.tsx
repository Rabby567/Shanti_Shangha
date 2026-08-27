import { useCallback, useEffect, useState } from "react";
import { About } from "./components/About";
import { AboutPage } from "./components/AboutPage";
import { Activities } from "./components/Activities";
import { ActivitiesPage } from "./components/ActivitiesPage";
import { ActivityDetailPage } from "./components/ActivityDetailPage";
import { BloodService } from "./components/BloodService";
import { Footer } from "./components/Footer";
import { Gallery } from "./components/Gallery";
import { GalleryPage } from "./components/GalleryPage";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MemberRegistration } from "./components/MemberRegistration";
import { QuoteStrip } from "./components/QuoteStrip";
import type { SectionId } from "./types";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [route, setRoute] = useState(window.location.hash);

  /**
   * Keep the lightweight hash router synchronized with browser navigation.
   * This gives the site dedicated activity/archive URLs without adding a
   * routing dependency to this small project.
   */
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
  const isAboutPage = route === "#/about";
  const isActivitiesPage = route === "#/activities";
  const isGalleryPage = route === "#/gallery";
  const activityNumber = activityRouteMatch
    ? decodeURIComponent(activityRouteMatch[1])
    : "";

  return (
    <div className="site">
      <Header
        mobileMenuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen((isOpen) => !isOpen)}
        onNavigate={scrollToSection}
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
          <About />
          <Activities />
          <Gallery />
          <MemberRegistration onSubmit={showToast} />
          <BloodService onSubmit={showToast} />
        </main>
      )}

      <Footer onNavigate={scrollToSection} />

      {toastMessage && (
        <div className="toast" role="status" aria-live="polite">
          ✓ {toastMessage}
        </div>
      )}

      {/* Temporary floating help control; functionality can be added later. */}
      <button className="float-help" type="button" aria-label="সহায়তা">
        💬
      </button>
    </div>
  );
}

export default App;
