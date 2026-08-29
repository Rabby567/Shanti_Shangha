import { FormEvent, useEffect, useRef, useState } from "react";
import type { AdminUser } from "../types";
import {
  defaultSettings,
  getSettings,
  type SettingsBundle,
  type SystemStatus,
} from "../siteSettings";
import { mediaUrl } from "../media";

const roleLabel: Record<AdminUser["role"], string> = {
  super_admin: "Super Admin",
  admin: "Admin",
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "A";
}

export function SettingsManagement() {
  const [me, setMe] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<SettingsBundle>(defaultSettings);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemLoading, setSystemLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("website");

  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");

  const isSuperAdmin = me?.role === "super_admin";

  const flash = (message: string) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const loadMe = async () => {
    const response = await fetch("/api/auth.php?action=me", { credentials: "include" });
    const data = await response.json();
    if (!response.ok || !data.success || !data.authenticated) {
      throw new Error(data.message || "Admin information পাওয়া যায়নি।");
    }
    const admin = data.admin as AdminUser;
    setMe(admin);
    setProfileForm({ name: admin.name, email: admin.email, phone: admin.phone || "" });
    setProfilePreview(admin.avatar_path || "");
  };

  const loadAll = async () => {
    try {
      const [bundle] = await Promise.all([getSettings(), loadMe()]);
      setSettings(bundle);
      await loadSystem();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings load করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  const loadSystem = async () => {
    setSystemLoading(true);
    try {
      const response = await fetch("/api/settings.php?action=system", { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "System status পাওয়া যায়নি।");
      setSystem(data.system);
    } catch (e) {
      setError(e instanceof Error ? e.message : "System status পাওয়া যায়নি।");
    } finally {
      setSystemLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    return () => {
      if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const updateGroup = <K extends keyof SettingsBundle>(
    group: K,
    values: Partial<SettingsBundle[K]>
  ) => {
    setSettings((current) => ({
      ...current,
      [group]: { ...current[group], ...values },
    }));
    setNotice("");
    setError("");
  };

  const saveGroup = async (action: string, payload: unknown, label: string) => {
    setSaving(label);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/settings.php?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Settings save করা যায়নি।");
      flash("পরিবর্তন সফলভাবে সংরক্ষণ হয়েছে।");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settings save করা যায়নি।");
    } finally {
      setSaving(null);
    }
  };

  const uploadAsset = async (type: "logo" | "favicon" | "hero", file: File | null) => {
    if (!file) return;
    const allowed = type === "logo"
      ? ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
      : type === "favicon"
        ? ["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"]
        : ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError(type === "logo" ? "Logo: JPG, PNG, WEBP অথবা SVG দিন।" : type === "favicon" ? "Favicon: ICO, PNG, JPG অথবা WEBP দিন।" : "Hero image: JPG, PNG অথবা WEBP দিন।");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image সর্বোচ্চ 8MB হতে পারবে।");
      return;
    }

    setUploadingAsset(type);
    setError("");
    try {
      const body = new FormData();
      body.append("type", type);
      body.append("file", file);
      const response = await fetch("/api/settings.php?action=asset", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Image upload করা যায়নি।");

      if (type === "logo") {
        updateGroup("site", { logo_path: data.path });
        setLogoFile(null);
      } else if (type === "favicon") {
        updateGroup("site", { favicon_path: data.path });
        setFaviconFile(null);
      } else {
        updateGroup("homepage", { hero_image: data.path });
        setHeroFile(null);
      }
      flash("Image সফলভাবে আপলোড হয়েছে।");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload করা যায়নি।");
    } finally {
      setUploadingAsset(null);
    }
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", profileForm.name);
      body.append("email", profileForm.email);
      body.append("phone", profileForm.phone);
      if (profileFile) body.append("avatar", profileFile);
      const response = await fetch("/api/auth.php?action=profile", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Profile save করা যায়নি।");
      setMe(data.admin);
      setProfilePreview(data.admin.avatar_path || "");
      setProfileFile(null);
      if (profileFileRef.current) profileFileRef.current.value = "";
      window.dispatchEvent(new CustomEvent("admin-profile-updated", { detail: data.admin }));
      flash("Profile সফলভাবে আপডেট হয়েছে।");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile save করা যায়নি।");
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New password এবং confirm password একই হতে হবে।");
      return;
    }
    setPasswordSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth.php?action=password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Password পরিবর্তন করা যায়নি।");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      flash(data.message || "Password পরিবর্তন হয়েছে।");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password পরিবর্তন করা যায়নি।");
    } finally {
      setPasswordSaving(false);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm("এই Admin-এর সব active session logout করতে চান?")) return;
    try {
      const response = await fetch("/api/auth.php?action=logout-all", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Logout all করা যায়নি।");
      flash(data.message);
      window.setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Logout all করা যায়নি।");
    }
  };

  if (loading) {
    return <section className="admin-module"><div className="admin-form-card admin-settings-loading">Settings প্রস্তুত হচ্ছে...</div></section>;
  }

  const tabs = [
    ["website", "🌐 Website"],
    ["homepage", "🏠 Homepage"],
    ["security", "🔐 Security"],
    ["system", "🗄️ System"],
    ["uploads", "🖼️ Uploads"],
    ["notifications", "🔔 Notifications"],
    ["contact-social", "☎ Contact & Social"],
    ["location", "📍 Location Map"],
    ["account", "👤 My Account"],
  ];

  return (
    <section className="admin-module admin-settings-module">
      <div className="admin-module-header">
        <div>
          <span className="admin-kicker">CONFIGURATION CENTER</span>
          <h1>সেটিংস</h1>
          <p>ওয়েবসাইট, homepage, security, uploads, notifications এবং admin account এক জায়গা থেকে পরিচালনা করুন।</p>
        </div>
      </div>

      {notice && <div className="admin-success-notice">✓ {notice}</div>}
      {error && <div className="admin-login-error admin-settings-error">{error}</div>}

      <div className="admin-settings-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "website" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">WEBSITE IDENTITY</span>
              <h2>ওয়েবসাইটের Basic Settings</h2>
              <p>Public website-এর নাম, branding এবং contact information এখান থেকে নিয়ন্ত্রণ করুন।</p>
            </div>

            <div className="admin-form-grid">
              <label>Website Name *
                <input value={settings.site.name} onChange={(e) => updateGroup("site", { name: e.target.value })} />
              </label>
              <label>Website Tagline
                <input value={settings.site.tagline} onChange={(e) => updateGroup("site", { tagline: e.target.value })} />
              </label>
              <label>Contact Phone
                <input type="tel" value={settings.site.contact_phone} onChange={(e) => updateGroup("site", { contact_phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </label>
              <label>Contact Email
                <input type="email" value={settings.site.contact_email} onChange={(e) => updateGroup("site", { contact_email: e.target.value })} />
              </label>
              <label className="full">Address
                <textarea rows={3} value={settings.site.address} onChange={(e) => updateGroup("site", { address: e.target.value })} />
              </label>
              <label>Facebook URL
                <input type="url" value={settings.site.facebook_url} onChange={(e) => updateGroup("site", { facebook_url: e.target.value })} placeholder="https://facebook.com/..." />
              </label>
              <label>YouTube URL
                <input type="url" value={settings.site.youtube_url} onChange={(e) => updateGroup("site", { youtube_url: e.target.value })} placeholder="https://youtube.com/..." />
              </label>
              <label>Instagram URL
                <input type="url" value={settings.site.instagram_url} onChange={(e) => updateGroup("site", { instagram_url: e.target.value })} placeholder="https://instagram.com/..." />
              </label>
              <label>Website Status
                <select value={settings.site.status} onChange={(e) => updateGroup("site", { status: e.target.value as "active" | "maintenance" })}>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>
            </div>

            <div className="admin-asset-grid">
              <AssetCard title="Logo" path={settings.site.logo_path} file={logoFile} setFile={setLogoFile} onUpload={() => uploadAsset("logo", logoFile)} uploading={uploadingAsset === "logo"} />
              <AssetCard title="Favicon" path={settings.site.favicon_path} file={faviconFile} setFile={setFaviconFile} onUpload={() => uploadAsset("favicon", faviconFile)} uploading={uploadingAsset === "favicon"} />
            </div>

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "site"} onClick={() => saveGroup("save-site", {
                name: settings.site.name,
                tagline: settings.site.tagline,
                contact_phone: settings.site.contact_phone,
                contact_email: settings.site.contact_email,
                address: settings.site.address,
                facebook_url: settings.site.facebook_url,
                youtube_url: settings.site.youtube_url,
                instagram_url: settings.site.instagram_url,
                status: settings.site.status,
              }, "site")}>
                {saving === "site" ? "সংরক্ষণ হচ্ছে..." : "Website Settings Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "homepage" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">HOMEPAGE CONFIGURATION</span>
              <h2>Homepage Settings</h2>
              <p>Homepage-এর visibility এবং hero configuration নিয়ন্ত্রণ করুন। Content-এর বিস্তারিত edit আলাদা Homepage Management-এ থাকবে।</p>
            </div>
            <div className="admin-form-grid">
              <label>Hero Title — Line 1
                <input value={settings.homepage.hero_title_line1} onChange={(e) => updateGroup("homepage", { hero_title_line1: e.target.value })} />
              </label>
              <label>Hero Title — Line 2
                <input value={settings.homepage.hero_title_line2} onChange={(e) => updateGroup("homepage", { hero_title_line2: e.target.value })} />
              </label>
              <label className="full">Hero Subtitle
                <textarea rows={4} value={settings.homepage.hero_subtitle} onChange={(e) => updateGroup("homepage", { hero_subtitle: e.target.value })} />
              </label>
            </div>

            <div className="admin-asset-grid">
              <AssetCard title="Hero Image" path={settings.homepage.hero_image} file={heroFile} setFile={setHeroFile} onUpload={() => uploadAsset("hero", heroFile)} uploading={uploadingAsset === "hero"} />
            </div>

            <div className="admin-toggle-grid">
              <Toggle label="About section" checked={settings.homepage.about_enabled} onChange={(v) => updateGroup("homepage", { about_enabled: v })} />
              <Toggle label="Activities section" checked={settings.homepage.activities_enabled} onChange={(v) => updateGroup("homepage", { activities_enabled: v })} />
              <Toggle label="Gallery section" checked={settings.homepage.gallery_enabled} onChange={(v) => updateGroup("homepage", { gallery_enabled: v })} />
              <Toggle label="Blood service section" checked={settings.homepage.blood_enabled} onChange={(v) => updateGroup("homepage", { blood_enabled: v })} />
              <Toggle label="Statistics section" checked={settings.homepage.statistics_enabled} onChange={(v) => updateGroup("homepage", { statistics_enabled: v })} />
            </div>

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "homepage"} onClick={() => saveGroup("save-homepage", {
                hero_title_line1: settings.homepage.hero_title_line1,
                hero_title_line2: settings.homepage.hero_title_line2,
                hero_subtitle: settings.homepage.hero_subtitle,
                about_enabled: settings.homepage.about_enabled,
                activities_enabled: settings.homepage.activities_enabled,
                gallery_enabled: settings.homepage.gallery_enabled,
                blood_enabled: settings.homepage.blood_enabled,
                statistics_enabled: settings.homepage.statistics_enabled,
              }, "homepage")}>
                {saving === "homepage" ? "সংরক্ষণ হচ্ছে..." : "Homepage Settings Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">SECURITY</span>
              <h2>Admin Security</h2>
              <p>Login protection এবং session policy পরিবর্তন করুন। এই অংশ শুধু Super Admin পরিবর্তন করতে পারবেন।</p>
            </div>
            <div className="admin-toggle-grid">
              <Toggle label="Login protection" description="একাধিক ভুল login হলে সাময়িকভাবে block করবে।" checked={settings.security.login_protection} onChange={(v) => updateGroup("security", { login_protection: v })} />
            </div>
            <div className="admin-form-grid">
              <label>Session Timeout (minutes)
                <input type="number" min={15} max={1440} value={settings.security.session_timeout} onChange={(e) => updateGroup("security", { session_timeout: Number(e.target.value) })} />
                <small className="admin-field-help">15 মিনিট থেকে 24 ঘণ্টা। Inactivity-এর পর session expire হবে।</small>
              </label>
              <label>Failed Login Limit
                <input type="number" min={3} max={20} value={settings.security.failed_login_limit} onChange={(e) => updateGroup("security", { failed_login_limit: Number(e.target.value) })} />
                <small className="admin-field-help">15 মিনিটে এই সংখ্যক ভুল login হলে block হবে।</small>
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "security"} onClick={() => saveGroup("save-security", {
                session_timeout: settings.security.session_timeout,
                login_protection: settings.security.login_protection,
                failed_login_limit: settings.security.failed_login_limit,
              }, "security")}>
                {saving === "security" ? "সংরক্ষণ হচ্ছে..." : "Security Save করুন"}
              </button>
              <button className="admin-secondary-button" type="button" onClick={logoutAll}>সব Session Logout করুন</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">SYSTEM HEALTH</span>
              <h2>Database / System Status</h2>
              <p>Server এবং API-এর বর্তমান health status দেখুন।</p>
            </div>
            <div className="admin-system-grid">
              {[
                ["Database", system?.database],
                ["API", system?.api],
                ["PHP version", system?.php_version],
                ["MySQL version", system?.mysql_version],
                ["Application version", system?.application_version],
                ["Upload directory", system?.upload_directory],
                ["GD / Image processing", system?.gd],
              ].map(([label, value]) => (
                <div className="admin-system-card" key={label}>
                  <span>{label}</span>
                  <strong className={value === "Connected" || value === "Ready" || value === "Available" ? "is-ok" : ""}>
                    {systemLoading ? "Checking..." : value || "—"}
                  </strong>
                </div>
              ))}
            </div>
            <div className="admin-form-actions">
              <button className="admin-secondary-button" type="button" onClick={loadSystem} disabled={systemLoading}>
                {systemLoading ? "Checking..." : "Status Refresh করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "uploads" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">MEDIA</span>
              <h2>Upload Settings</h2>
              <p>Gallery এবং website media upload-এর basic policy নির্ধারণ করুন।</p>
            </div>
            <div className="admin-form-grid">
              <label>Maximum Image Size (MB)
                <input type="number" min={1} max={50} value={settings.upload.max_size_mb} onChange={(e) => updateGroup("upload", { max_size_mb: Number(e.target.value) })} />
              </label>
              <label>Upload Directory
                <input value={settings.upload.directory} readOnly />
              </label>
            </div>
            <div className="admin-form-section-heading small">
              <h3>Allowed Formats</h3>
            </div>
            <div className="admin-format-grid">
              {["jpg", "png", "webp", "gif"].map((format) => (
                <label className="admin-check-tile" key={format}>
                  <input
                    type="checkbox"
                    checked={settings.upload.allowed_formats.includes(format)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...settings.upload.allowed_formats, format]
                        : settings.upload.allowed_formats.filter((item) => item !== format);
                      updateGroup("upload", { allowed_formats: next });
                    }}
                  />
                  <span>{format.toUpperCase()}</span>
                </label>
              ))}
            </div>
            <div className="admin-toggle-grid">
              <Toggle label="Image optimization" description="Image processing pipeline enable/disable configuration." checked={settings.upload.optimization_enabled} onChange={(v) => updateGroup("upload", { optimization_enabled: v })} />
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "upload"} onClick={() => saveGroup("save-upload", {
                max_size_mb: settings.upload.max_size_mb,
                allowed_formats: settings.upload.allowed_formats,
                optimization_enabled: settings.upload.optimization_enabled,
              }, "upload")}>
                {saving === "upload" ? "সংরক্ষণ হচ্ছে..." : "Upload Settings Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contact-social" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">CONTACT CENTER</span>
              <h2>ইমেইল ও কল সেটিংস</h2>
              <p>ওয়েবসাইটের contact form কোন ইমেইলে যাবে এবং Call Us button কোন নম্বরে কল করবে তা এখান থেকে নিয়ন্ত্রণ করুন।</p>
            </div>

            <div className="admin-form-grid">
              <label>Mail recipient / Gmail *
                <input type="email" value={settings.site.contact_email} onChange={(e) => updateGroup("site", { contact_email: e.target.value })} placeholder="yourgmail@gmail.com" />
                <small className="admin-field-help">Contact form submit হলে এই ঠিকানায় মেইল যাবে।</small>
              </label>
              <label>Call Us phone number *
                <input type="tel" value={settings.site.contact_phone} onChange={(e) => updateGroup("site", { contact_phone: e.target.value })} placeholder="01XXXXXXXXX" />
                <small className="admin-field-help">Header এবং floating Call button এই নম্বর ব্যবহার করবে।</small>
              </label>
            </div>

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "contact-social"} onClick={() => saveGroup("save-contact-social", {
                contact_phone: settings.site.contact_phone,
                contact_email: settings.site.contact_email,
                facebook_url: settings.site.facebook_url,
                youtube_url: settings.site.youtube_url,
                instagram_url: settings.site.instagram_url,
              }, "contact-social")}>
                {saving === "contact-social" ? "সংরক্ষণ হচ্ছে..." : "Contact Settings Save করুন"}
              </button>
            </div>
          </div>

          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">GMAIL SMTP</span>
              <h2>Contact Form Mail Delivery</h2>
              <p>localhost/XAMPP থেকে Gmail-এ সরাসরি mail পাঠাতে SMTP ব্যবহার করুন। Gmail account-এর জন্য App Password ব্যবহার করুন; মূল Gmail password দেবেন না।</p>
            </div>
            <div className="admin-toggle-grid">
              <Toggle label="Gmail SMTP চালু করুন" description="চালু থাকলে Contact Form SMTP দিয়ে mail পাঠাবে।" checked={settings.smtp.enabled} onChange={(v) => updateGroup("smtp", { enabled: v })} />
            </div>
            <div className="admin-form-grid">
              <label>SMTP Gmail *
                <input type="email" value={settings.smtp.username} onChange={(e) => updateGroup("smtp", { username: e.target.value })} placeholder="yourgmail@gmail.com" />
              </label>
              <label>Gmail App Password *
                <input type="password" value={settings.smtp.password} onChange={(e) => updateGroup("smtp", { password: e.target.value })} placeholder="বর্তমান password রাখতে খালি রাখুন" autoComplete="new-password" />
                <small className="admin-field-help">Google Account → Security → 2-Step Verification → App passwords থেকে তৈরি করুন।</small>
              </label>
              <label>SMTP Host
                <input value={settings.smtp.host} onChange={(e) => updateGroup("smtp", { host: e.target.value })} />
              </label>
              <label>SMTP Port
                <input type="number" min={1} max={65535} value={settings.smtp.port} onChange={(e) => updateGroup("smtp", { port: Number(e.target.value) || 587 })} />
              </label>
              <label>Encryption
                <select value={settings.smtp.encryption} onChange={(e) => updateGroup("smtp", { encryption: e.target.value as "tls" | "ssl" | "none" })}>
                  <option value="tls">TLS / STARTTLS (587)</option>
                  <option value="ssl">SSL (465)</option>
                  <option value="none">None</option>
                </select>
              </label>
              <label>Sender Name
                <input value={settings.smtp.from_name} onChange={(e) => updateGroup("smtp", { from_name: e.target.value })} placeholder="শান্তি সংঘ Website" />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "smtp"} onClick={() => saveGroup("save-smtp", { ...settings.smtp }, "smtp")}>
                {saving === "smtp" ? "সংরক্ষণ হচ্ছে..." : "Gmail SMTP Save করুন"}
              </button>
              <button className="admin-secondary-button" type="button" disabled={!isSuperAdmin || saving === "smtp-test"} onClick={async () => {
                setSaving("smtp-test"); setNotice(""); setError("");
                try {
                  const response = await fetch("/api/settings.php?action=test-smtp", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
                  const data = await response.json();
                  if (!response.ok || !data.success) throw new Error(data.message || "SMTP test failed");
                  flash(data.message || "Test email পাঠানো হয়েছে।");
                } catch (e) { setError(e instanceof Error ? e.message : "SMTP test failed"); }
                finally { setSaving(null); }
              }}>
                {saving === "smtp-test" ? "Test হচ্ছে..." : "Test Email পাঠান"}
              </button>
            </div>
          </div>

          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">SOCIAL MEDIA MANAGER</span>
              <h2>Footer Social Links</h2>
              <p>Footer-এ দেখানো social media link যোগ, edit অথবা delete করুন। Delete করতে URL খালি করে Save করুন।</p>
            </div>

            <div className="social-links-admin-grid">
              {[
                ["Facebook", "facebook_url", settings.site.facebook_url, "https://facebook.com/yourpage"],
                ["YouTube", "youtube_url", settings.site.youtube_url, "https://youtube.com/@yourchannel"],
                ["Instagram", "instagram_url", settings.site.instagram_url, "https://instagram.com/yourpage"],
              ].map(([label, key, value, placeholder]) => (
                <div className="social-link-admin-card" key={key}>
                  <div className="social-link-admin-head">
                    <div><span className="social-link-admin-icon">{label === "Facebook" ? "f" : label === "YouTube" ? "▶" : "◎"}</span><strong>{label}</strong></div>
                    <button type="button" className="admin-danger-mini" disabled={!isSuperAdmin || !value} onClick={() => updateGroup("site", { [key]: "" } as Partial<SettingsBundle["site"]>)} title={`${label} link delete করুন`}>Delete</button>
                  </div>
                  <input type="url" value={value} onChange={(e) => updateGroup("site", { [key]: e.target.value } as Partial<SettingsBundle["site"]>)} placeholder={placeholder} />
                  <small>{value ? "Footer-এ active" : "এখনো link যোগ করা হয়নি"}</small>
                </div>
              ))}
            </div>

            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "contact-social-links"} onClick={() => saveGroup("save-contact-social", {
                contact_phone: settings.site.contact_phone,
                contact_email: settings.site.contact_email,
                facebook_url: settings.site.facebook_url,
                youtube_url: settings.site.youtube_url,
                instagram_url: settings.site.instagram_url,
              }, "contact-social-links")}>
                {saving === "contact-social-links" ? "সংরক্ষণ হচ্ছে..." : "Social Links Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">NOTIFICATIONS</span>
              <h2>Notification Settings</h2>
              <p>নতুন আবেদন বা content activity-এর notification policy ঠিক করুন।</p>
            </div>
            <div className="admin-toggle-grid">
              <Toggle label="New blood request" description="নতুন রক্তের আবেদন এলে notification চালু থাকবে।" checked={settings.notifications.blood_request} onChange={(v) => updateGroup("notifications", { blood_request: v })} />
              <Toggle label="New member application" description="নতুন সদস্য আবেদন এলে notification চালু থাকবে।" checked={settings.notifications.member_application} onChange={(v) => updateGroup("notifications", { member_application: v })} />
              <Toggle label="New activity" description="নতুন কার্যক্রম publish হলে notification চালু থাকবে।" checked={settings.notifications.activity} onChange={(v) => updateGroup("notifications", { activity: v })} />
              <Toggle label="New donation" description="নতুন অনুদানের তথ্য এলে notification চালু থাকবে।" checked={settings.notifications.donation} onChange={(v) => updateGroup("notifications", { donation: v })} />
              <Toggle label="Email notification" description="Email delivery pipeline-এর global switch।" checked={settings.notifications.email_enabled} onChange={(v) => updateGroup("notifications", { email_enabled: v })} />
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "notifications"} onClick={() => saveGroup("save-notifications", {
                blood_request: settings.notifications.blood_request,
                member_application: settings.notifications.member_application,
                activity: settings.notifications.activity,
                donation: settings.notifications.donation,
                email_enabled: settings.notifications.email_enabled,
              }, "notifications")}>
                {saving === "notifications" ? "সংরক্ষণ হচ্ছে..." : "Notification Settings Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "location" && (
        <div className="admin-settings-stack">
          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">LOCATION MAP</span>
              <h2>ওয়েবসাইটের Location Map</h2>
              <p>Footer-এর ডান পাশে যে map দেখাবে, তার location এখানে সেট করুন। Address লিখলে সেটিও Contact section-এ দেখানো হবে।</p>
            </div>
            <div className="admin-form-grid">
              <label className="full">Location / Google Maps Search *
                <input value={settings.site.map_query} onChange={(e) => updateGroup("site", { map_query: e.target.value })} placeholder="যেমন: Pirojpur, Bangladesh অথবা পূর্ণ ঠিকানা" />
                <small className="admin-field-help">সঠিক location পেতে Google Maps-এর নাম/ঠিকানা এখানে লিখুন। চাইলে latitude, longitude-ও দিতে পারেন।</small>
              </label>
              <label className="full">Address / ঠিকানা
                <textarea rows={3} value={settings.site.address} onChange={(e) => updateGroup("site", { address: e.target.value })} placeholder="অফিস/সংগঠনের পূর্ণ ঠিকানা" />
              </label>
              <label className="full">Google Maps Embed URL / iframe
                <textarea rows={4} value={settings.site.map_embed_url} onChange={(e) => updateGroup("site", { map_embed_url: e.target.value })} placeholder="Google Maps → Share → Embed a map থেকে iframe-এর src URL অথবা পুরো iframe দিন" />
                <small className="admin-field-help">Google Maps-এর Embed a map code paste করতে পারো। Save করার সময় iframe-এর src নিজে থেকে বের করে নেওয়া হবে।</small>
              </label>
              <label>Map Zoom
                <input type="number" min={1} max={21} value={settings.site.map_zoom} onChange={(e) => updateGroup("site", { map_zoom: Number(e.target.value) || 15 })} />
              </label>
            </div>
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="button" disabled={!isSuperAdmin || saving === "location"} onClick={() => saveGroup("save-location", { map_query: settings.site.map_query, map_embed_url: settings.site.map_embed_url, address: settings.site.address, map_zoom: settings.site.map_zoom }, "location")}>
                {saving === "location" ? "সংরক্ষণ হচ্ছে..." : "Location Save করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "account" && (
        <div className="admin-settings-stack">
          <div className="admin-settings-grid">
            <form className="admin-form-card" onSubmit={saveProfile}>
              <div className="admin-form-section-heading">
                <span className="admin-kicker">MY PROFILE</span>
                <h2>Admin Profile</h2>
                <p>আপনার নাম, ছবি, phone এবং login email আপডেট করুন।</p>
              </div>
              <div className="admin-profile-editor">
                <div className="admin-avatar-editor">
                  {profilePreview ? <img src={profilePreview} alt={me?.name || "Admin"} /> : <span>{initials(me?.name || "A")}</span>}
                  <button type="button" onClick={() => profileFileRef.current?.click()}>ছবি পরিবর্তন</button>
                  <input ref={profileFileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 3*1024*1024) {
                      setError("Profile image JPG/PNG/WEBP এবং সর্বোচ্চ 3MB হতে হবে.");
                      return;
                    }
                    if (profilePreview.startsWith("blob:")) URL.revokeObjectURL(profilePreview);
                    setProfileFile(file);
                    setProfilePreview(URL.createObjectURL(file));
                  }} />
                  <small>JPG / PNG / WEBP · সর্বোচ্চ 3MB</small>
                </div>
                <div className="admin-form-grid">
                  <label>Admin Name *
                    <input required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </label>
                  <label>Phone Number
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                  </label>
                  <label className="full">Email *
                    <input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                  </label>
                </div>
              </div>
              <div className="admin-form-actions">
                <button className="admin-primary-button" disabled={profileSaving}>{profileSaving ? "সংরক্ষণ হচ্ছে..." : "Profile Save করুন"}</button>
              </div>
            </form>

            <form className="admin-form-card" onSubmit={savePassword}>
              <div className="admin-form-section-heading">
                <span className="admin-kicker">PASSWORD</span>
                <h2>Password পরিবর্তন</h2>
              </div>
              <div className="admin-form-grid">
                <label className="full">Current Password *
                  <input type="password" autoComplete="current-password" required value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                </label>
                <label>New Password *
                  <input type="password" minLength={8} autoComplete="new-password" required value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
                </label>
                <label>Confirm Password *
                  <input type="password" minLength={8} autoComplete="new-password" required value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
                </label>
              </div>
              <div className="admin-form-actions">
                <button className="admin-primary-button" disabled={passwordSaving}>{passwordSaving ? "পরিবর্তন হচ্ছে..." : "Password Change করুন"}</button>
              </div>
            </form>
          </div>

          <div className="admin-form-card">
            <div className="admin-form-section-heading">
              <span className="admin-kicker">ACCESS</span>
              <h2>Current Access</h2>
            </div>
            <div className="admin-admin-summary">
              <span>আপনার role <strong>{roleLabel[me?.role || "admin"]}</strong></span>
              <span>Status <strong>{me?.is_active ? "Active" : "Inactive"}</strong></span>
              <span>Last login <strong>{me?.last_login_at || "—"}</strong></span>
            </div>
          </div>
        </div>
      )}

      {!isSuperAdmin && (
        <div className="admin-access-note">
          🔒 Website, Homepage, Security, Upload এবং Notification configuration পরিবর্তন করতে Super Admin permission প্রয়োজন।
        </div>
      )}
    </section>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="admin-toggle-card">
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function AssetCard({
  title,
  path,
  file,
  setFile,
  onUpload,
  uploading,
}: {
  title: string;
  path: string;
  file: File | null;
  setFile: (file: File | null) => void;
  onUpload: () => void;
  uploading: boolean;
}) {
  return (
    <div className="admin-asset-card">
      <div className="admin-asset-preview">
        {path ? <img src={mediaUrl(path)} alt={title} /> : <span>NO IMAGE</span>}
      </div>
      <div>
        <strong>{title}</strong>
        <small>{path || "কোনো file set করা নেই"}</small>
      </div>
      <input type="file" accept={title === "Logo" ? "image/*" : title === "Favicon" ? ".ico,image/*" : "image/jpeg,image/png,image/webp"} onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button className="admin-secondary-button" type="button" disabled={!file || uploading} onClick={onUpload}>
        {uploading ? "আপলোড হচ্ছে..." : `${title} Upload করুন`}
      </button>
    </div>
  );
}
