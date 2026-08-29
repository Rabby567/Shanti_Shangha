import { useEffect, useState } from "react";
import { HomepageManagement } from "./HomepageManagement";
import { ActivitiesManagement } from "./ActivitiesManagement";
import { GalleryManagement } from "./GalleryManagement";
import { AboutManagement } from "./AboutManagement";
import { BloodRequestsManagement } from "./BloodRequestsManagement";
import { BloodDonorsManagement } from "./BloodDonorsManagement";
import { MemberApplicationsManagement } from "./MemberApplicationsManagement";
import { SettingsManagement } from "./SettingsManagement";
import { DonationManagement } from "./DonationManagement";
import type { AdminUser } from "../types";
import { mediaUrl } from "../media";

interface AdminDashboardProps {
  onBackToWebsite: () => void;
  onLogout: () => void;
}

type AdminSection =
  | "dashboard"
  | "activities"
  | "gallery"
  | "about"
  | "homepage"
  | "blood-requests"
  | "blood-donors"
  | "members"
  | "donation"
  | "settings";

const menuGroups = [
  {
    label: "মূল মেনু",
    items: [
      { id: "dashboard", label: "ড্যাশবোর্ড", icon: "⌂" },
      { id: "activities", label: "কার্যক্রম", icon: "▣" },
      { id: "gallery", label: "গ্যালারি", icon: "▧" },
    ],
  },
  {
    label: "ওয়েবসাইট",
    items: [
      { id: "about", label: "আমাদের সম্পর্কে", icon: "◉" },
      { id: "homepage", label: "হোমপেজ", icon: "⌁" },
    ],
  },
  {
    label: "সেবা ও আবেদন",
    items: [
      { id: "blood-requests", label: "রক্তের আবেদন", icon: "♥" },
      { id: "blood-donors", label: "রক্তদাতা তালিকা", icon: "♢" },
      { id: "members", label: "সদস্য আবেদন", icon: "♙" },
      { id: "donation", label: "অনুদান", icon: "৳" },
    ],
  },
];

type DashboardStats = {
  members: number;
  activities: number;
  donors: number;
  requests: number;
};

const emptyStats: DashboardStats = {
  members: 0,
  activities: 0,
  donors: 0,
  requests: 0,
};

const formatCount = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

const sectionTitles: Record<AdminSection, { title: string; description: string }> = {
  dashboard: {
    title: "ড্যাশবোর্ড",
    description: "শান্তি সংঘের ওয়েবসাইটের সামগ্রিক অবস্থা এক নজরে দেখুন।",
  },
  activities: {
    title: "কার্যক্রম",
    description: "কার্যক্রম যোগ, সম্পাদনা, প্রকাশ এবং মুছে ফেলা হবে এখান থেকে।",
  },
  gallery: {
    title: "গ্যালারি",
    description: "ওয়েবসাইটের ছবি আপলোড ও পরিচালনা করুন।",
  },
  about: {
    title: "আমাদের সম্পর্কে",
    description: "About page-এর লেখা ও accordion content পরিচালনা করুন।",
  },
  homepage: {
    title: "হোমপেজ",
    description: "Hero, statistics এবং homepage-এর গুরুত্বপূর্ণ content পরিচালনা করুন।",
  },
  "blood-requests": {
    title: "রক্তের আবেদন",
    description: "রক্তের জন্য আসা আবেদনগুলো দেখুন ও status পরিচালনা করুন।",
  },
  "blood-donors": {
    title: "রক্তদাতা তালিকা",
    description: "নিবন্ধিত রক্তদাতাদের তথ্য, availability এবং approval পরিচালনা করুন।",
  },
  members: {
    title: "সদস্য আবেদন",
    description: "নতুন সদস্যদের আবেদন দেখুন ও পরিচালনা করুন।",
  },
  donation: {
    title: "অনুদান",
    description: "অনুদানের মাধ্যম, form এবং জমা হওয়া donation পরিচালনা করুন।",
  },
  settings: {
    title: "সেটিংস",
    description: "Admin account এবং dashboard-এর configuration পরিচালনা করুন।",
  },
};

export function AdminDashboard({ onBackToWebsite, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch("/api/dashboard.php?action=stats", {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Dashboard stats unavailable");
        }

        if (!cancelled) {
          setStats(data.stats);
          setStatsError(false);
        }
      } catch {
        if (!cancelled) setStatsError(true);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    loadStats();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<AdminUser>;
      if (customEvent.detail) setCurrentAdmin(customEvent.detail);
    };

    window.addEventListener("admin-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("admin-profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth.php?action=me", { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.success && data.authenticated) {
          setCurrentAdmin(data.admin);
        }
      })
      .catch(() => {
        // The main route guard already handles authentication failures.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    { label: "মোট সদস্য", value: stats.members, note: "নিবন্ধিত সদস্য", icon: "♙" },
    { label: "কার্যক্রম", value: stats.activities, note: "প্রকাশিত কার্যক্রম", icon: "▣" },
    { label: "রক্তদাতা", value: stats.donors, note: "অনুমোদিত donor", icon: "♥" },
    { label: "রক্তের আবেদন", value: stats.requests, note: "চলমান আবেদন", icon: "＋" },
  ];

  const active = sectionTitles[activeSection];

  const selectSection = (section: AdminSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <button
          className="admin-brand admin-brand-button"
          type="button"
          onClick={onBackToWebsite}
          aria-label="ওয়েবসাইটের মূল পাতায় যান"
        >
          <img src="/images/logo.svg" alt="শান্তি সংঘ" />
          <div>
            <strong>শান্তি সংঘ</strong>
            <span>Admin Panel</span>
          </div>
        </button>

        <div className="admin-sidebar-content">
          {menuGroups.map((group) => (
            <div className="admin-menu-group" key={group.label}>
              <span className="admin-menu-label">{group.label}</span>

              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-menu-item ${
                    activeSection === item.id ? "is-active" : ""
                  }`}
                  onClick={() => selectSection(item.id as AdminSection)}
                >
                  <span className="admin-menu-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}

          <div className="admin-menu-group admin-menu-bottom">
            <button
              type="button"
              className={`admin-menu-item ${
                activeSection === "settings" ? "is-active" : ""
              }`}
              onClick={() => selectSection("settings")}
            >
              <span className="admin-menu-icon">⚙</span>
              <span>সেটিংস</span>
            </button>

            <button
              type="button"
              className="admin-menu-item admin-menu-back"
              onClick={onBackToWebsite}
            >
              <span className="admin-menu-icon">↗</span>
              <span>ওয়েবসাইট দেখুন</span>
            </button>

            <button
              type="button"
              className="admin-menu-item admin-menu-logout"
              onClick={async () => {
                try {
                  await fetch("/api/auth.php?action=logout", {
                    method: "POST",
                    credentials: "include",
                  });
                } finally {
                  onLogout();
                }
              }}
            >
              <span className="admin-menu-icon">↪</span>
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="admin-sidebar-overlay"
          type="button"
          aria-label="মেনু বন্ধ করুন"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Admin menu"
          >
            ☰
          </button>

          <div>
            <span className="admin-topbar-kicker">ADMINISTRATION</span>
            <strong>{active.title}</strong>
          </div>

          <div className="admin-profile">
            {currentAdmin?.avatar_path ? (
              <img className="admin-avatar admin-avatar-image" src={mediaUrl(currentAdmin.avatar_path)} alt={currentAdmin.name} />
            ) : (
              <span className="admin-avatar">
                {(currentAdmin?.name || "A").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{currentAdmin?.name || "Administrator"}</strong>
              <small>{currentAdmin?.role === "super_admin" ? "Super Admin" : "Admin"}</small>
            </div>
          </div>
        </header>

        <main className="admin-content">
          {activeSection === "dashboard" ? (
            <>
              <section className="admin-welcome">
                <div>
                  <span className="admin-kicker">স্বাগতম</span>
                  <h1>শান্তি সংঘ Admin Dashboard</h1>
                  <p>
                    এখান থেকে ওয়েবসাইটের content, কার্যক্রম, gallery,
                    সদস্য এবং রক্ত সেবা পরিচালনা করা যাবে।
                  </p>
                </div>

                <button
                  className="admin-primary-button"
                  type="button"
                  onClick={onBackToWebsite}
                >
                  ওয়েবসাইট দেখুন ↗
                </button>
              </section>

              <section className="admin-stat-grid" aria-label="পরিসংখ্যান">
                {statCards.map((stat) => (
                  <article className="admin-stat-card" key={stat.label}>
                    <div className="admin-stat-icon">{stat.icon}</div>
                    <div>
                      <span>{stat.label}</span>
                      <strong>{statsLoading ? "…" : formatCount(stat.value)}</strong>
                      <small>{stat.note}</small>
                    </div>
                  </article>
                ))}
              </section>

              {statsError && (
                <div className="admin-data-notice" role="status">
                  MySQL API এখনো সংযুক্ত নয়। cPanel-এ database configuration সম্পন্ন হলে এই সংখ্যাগুলো live data দেখাবে।
                </div>
              )}

              <section className="admin-panel-grid">
                <article className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <span className="admin-kicker">দ্রুত কাজ</span>
                      <h2>Content Management</h2>
                    </div>
                  </div>

                  <div className="admin-quick-grid">
                    <button type="button" onClick={() => selectSection("activities")}>
                      <span>＋</span>
                      <strong>কার্যক্রম যোগ করুন</strong>
                      <small>নতুন কার্যক্রম প্রকাশ করুন</small>
                    </button>

                    <button type="button" onClick={() => selectSection("gallery")}>
                      <span>＋</span>
                      <strong>ছবি যোগ করুন</strong>
                      <small>Gallery-তে নতুন ছবি দিন</small>
                    </button>

                    <button type="button" onClick={() => selectSection("blood-donors")}>
                      <span>♥</span>
                      <strong>রক্তদাতা দেখুন</strong>
                      <small>Donor directory পরিচালনা</small>
                    </button>

                    <button type="button" onClick={() => selectSection("blood-requests")}>
                      <span>!</span>
                      <strong>রক্তের আবেদন</strong>
                      <small>নতুন আবেদন পর্যালোচনা</small>
                    </button>
                  </div>
                </article>

                <article className="admin-panel admin-coming-panel">
                  <span className="admin-kicker">পরবর্তী ধাপ</span>
                  <h2>Dynamic Management</h2>
                  <p>
                    Dashboard এখন PHP API-এর মাধ্যমে MySQL-এর live data পড়ার জন্য প্রস্তুত।
                    পরের ধাপে প্রতিটি module-এর CRUD management panel তৈরি করা হবে।
                  </p>
                  <div className="admin-progress">
                    <span style={{ width: "35%" }} />
                  </div>
                  <small>MySQL API foundation complete</small>
                </article>
              </section>
            </>
          ) : activeSection === "homepage" ? (
            <HomepageManagement />
          ) : activeSection === "activities" ? (
            <ActivitiesManagement />
          ) : activeSection === "gallery" ? (
            <GalleryManagement />
          ) : activeSection === "about" ? (
            <AboutManagement />
          ) : activeSection === "blood-requests" ? (
            <BloodRequestsManagement />
          ) : activeSection === "blood-donors" ? (
            <BloodDonorsManagement />
          ) : activeSection === "members" ? (
            <MemberApplicationsManagement />
          ) : activeSection === "donation" ? (
            <DonationManagement />
          ) : activeSection === "settings" ? (
            <SettingsManagement />
          ) : (
            <section className="admin-empty-module">
              <span className="admin-kicker">MODULE</span>
              <h1>{active.title}</h1>
              <p>{active.description}</p>
              <div className="admin-module-placeholder">
                <span>⚙</span>
                <strong>এই module-এর management panel পরের ধাপে তৈরি হবে</strong>
                <small>
                  প্রথমে database ও authentication foundation connect করা হবে।
                </small>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
