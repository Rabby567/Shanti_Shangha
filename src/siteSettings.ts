export type SiteSettings = {
  name: string;
  tagline: string;
  logo_path: string;
  favicon_path: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  facebook_url: string;
  youtube_url: string;
  instagram_url: string;
  map_query: string;
  map_embed_url: string;
  map_zoom: number;
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
  donation: boolean;
  email_enabled: boolean;
};

export type SmtpSettings = {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: "tls" | "ssl" | "none";
  from_name: string;
};

export type SettingsBundle = {
  site: SiteSettings;
  homepage: HomepageSettings;
  security: SecuritySettings;
  upload: UploadSettings;
  notifications: NotificationSettings;
  smtp: SmtpSettings;
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
    youtube_url: "",
    instagram_url: "",
    map_query: "",
    map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d901.8938851531643!2d89.22123638610354!3d24.975387869154122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fcf7004f502853%3A0xd1f25d81589c19f9!2zU2hhbnRpIFNhbmdoYSAo4Ka24Ka-4Kao4KeN4Kak4Ka_IOCmuOCmguCmmCDgpq_gp4Hgpqwg4Ka44Kau4Ka-4KacIOCmleCmsuCnjeCmr-CmvuCmoyDgpqrgprDgpr_gprfgpqYpLCDgpqrgpr_gprDgpqwg4Kas4Ka-4Kac4Ka-4Kaw!5e1!3m2!1sen!2sbd!4v1788000871915!5m2!1sen!2sbd",
    map_zoom: 15,
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
  smtp: {
    enabled: false,
    host: "smtp.gmail.com",
    port: 587,
    username: "",
    password: "",
    encryption: "tls",
    from_name: "শান্তি সংঘ Website",
  },
  notifications: {
    blood_request: true,
    member_application: true,
    activity: true,
    donation: true,
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
    smtp: { ...defaultSettings.smtp, ...data.settings.smtp },
  };
}
