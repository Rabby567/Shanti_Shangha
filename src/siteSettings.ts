export type SiteSettings = {
  name: string;
  tagline: string;
  logo_path: string;
  favicon_path: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  facebook_url: string;
  status: "active" | "maintenance";
};

export type HomepageSettings = {
  hero_title_line1: string;
  hero_title_line2: string;
  hero_subtitle: string;
  hero_image: string;
  about_enabled: boolean;
  activities_enabled: boolean;
  gallery_enabled: boolean;
  blood_enabled: boolean;
  statistics_enabled: boolean;
};

export type SecuritySettings = {
  session_timeout: number;
  login_protection: boolean;
  failed_login_limit: number;
};

export type UploadSettings = {
  max_size_mb: number;
  allowed_formats: string[];
  directory: string;
  optimization_enabled: boolean;
};

export type NotificationSettings = {
  blood_request: boolean;
  member_application: boolean;
  activity: boolean;
  email_enabled: boolean;
};

export type SettingsBundle = {
  site: SiteSettings;
  homepage: HomepageSettings;
  security: SecuritySettings;
  upload: UploadSettings;
  notifications: NotificationSettings;
};

export type SystemStatus = {
  database: string;
  api: string;
  php_version: string;
  mysql_version: string;
  application_version: string;
  upload_directory: string;
  gd: string;
};

export const defaultSettings: SettingsBundle = {
  site: {
    name: "শান্তি সংঘ",
    tagline: "যুব সমাজ কল্যাণ পরিষদ",
    logo_path: "/images/logo.svg",
    favicon_path: "/images/logo.svg",
    contact_phone: "",
    contact_email: "admin@shantishangha.org",
    address: "",
    facebook_url: "",
    status: "active",
  },
  homepage: {
    hero_title_line1: "এসো শান্তি সংঘ করি,",
    hero_title_line2: "মানবতার সেবা করি",
    hero_subtitle:
      "অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।",
    hero_image: "",
    about_enabled: true,
    activities_enabled: true,
    gallery_enabled: true,
    blood_enabled: true,
    statistics_enabled: true,
  },
  security: {
    session_timeout: 120,
    login_protection: true,
    failed_login_limit: 5,
  },
  upload: {
    max_size_mb: 8,
    allowed_formats: ["jpg", "png", "webp", "gif"],
    directory: "/uploads",
    optimization_enabled: false,
  },
  notifications: {
    blood_request: true,
    member_application: true,
    activity: true,
    email_enabled: false,
  },
};

export async function getPublicSettings(): Promise<Pick<SettingsBundle, "site" | "homepage">> {
  try {
    const response = await fetch("/api/settings.php?action=public", { credentials: "include" });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error("Settings unavailable");
    return { site: { ...defaultSettings.site, ...data.site }, homepage: { ...defaultSettings.homepage, ...data.homepage } };
  } catch {
    return { site: defaultSettings.site, homepage: defaultSettings.homepage };
  }
}

export async function getSettings(): Promise<SettingsBundle> {
  const response = await fetch("/api/settings.php?action=get", { credentials: "include" });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "Settings load করা যায়নি।");
  return {
    site: { ...defaultSettings.site, ...data.settings.site },
    homepage: { ...defaultSettings.homepage, ...data.settings.homepage },
    security: { ...defaultSettings.security, ...data.settings.security },
    upload: { ...defaultSettings.upload, ...data.settings.upload },
    notifications: { ...defaultSettings.notifications, ...data.settings.notifications },
  };
}
