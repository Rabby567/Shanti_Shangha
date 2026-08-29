import { useEffect, useState } from "react";
import {
  defaultHomepageContent,
  getHomepageContent,
  type HomepageContent,
} from "../homepage";

const fields: Array<{
  key: keyof HomepageContent;
  label: string;
  multiline?: boolean;
}> = [
  { key: "hero_eyebrow", label: "Hero ছোট শিরোনাম" },
  { key: "hero_title_line1", label: "Hero প্রধান শিরোনাম — লাইন ১" },
  { key: "hero_title_line2", label: "Hero প্রধান শিরোনাম — লাইন ২" },
  { key: "hero_description", label: "Hero description", multiline: true },
  { key: "hero_primary_button", label: "প্রথম button-এর লেখা" },
  { key: "hero_secondary_button", label: "দ্বিতীয় button-এর লেখা" },
  { key: "quote_title", label: "Quote section title" },
  { key: "quote_description", label: "Quote section description", multiline: true },
  { key: "about_kicker", label: "About ছোট শিরোনাম" },
  { key: "about_title", label: "About প্রধান শিরোনাম" },
  { key: "about_paragraph1", label: "About paragraph ১", multiline: true },
  { key: "about_paragraph2", label: "About paragraph ২", multiline: true },
  { key: "about_quote", label: "About quote" },
  { key: "stat_1_value", label: "Statistic ১ — সংখ্যা" },
  { key: "stat_1_label", label: "Statistic ১ — নাম" },
  { key: "stat_2_value", label: "Statistic ২ — সংখ্যা" },
  { key: "stat_2_label", label: "Statistic ২ — নাম" },
  { key: "stat_3_value", label: "Statistic ৩ — সংখ্যা" },
  { key: "stat_3_label", label: "Statistic ৩ — নাম" },
  { key: "stat_4_value", label: "Statistic ৪ — সংখ্যা" },
  { key: "stat_4_label", label: "Statistic ৪ — নাম" },
];

export function HomepageManagement() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getHomepageContent().then((data) => {
      if (!cancelled) {
        setContent(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (key: keyof HomepageContent, value: string) => {
    setContent((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/homepage.php?action=save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Save failed");
      }

      setMessage("Homepage-এর content সফলভাবে সংরক্ষণ হয়েছে।");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-empty-module">
        <span className="admin-kicker">WEBSITE</span>
        <h1>হোমপেজ</h1>
        <p>Homepage-এর content লোড হচ্ছে...</p>
      </section>
    );
  }

  return (
    <section className="admin-homepage-module">
      <div className="admin-module-header">
        <div>
          <span className="admin-kicker">WEBSITE CONTENT</span>
          <h1>হোমপেজ পরিচালনা</h1>
          <p>এখান থেকে public homepage-এর লেখা ও statistics পরিবর্তন করতে পারবে।</p>
        </div>
        <button
          type="button"
          className="admin-primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
        </button>
      </div>

      {message && <div className="admin-success-notice">✓ {message}</div>}
      {error && <div className="admin-data-notice">{error}</div>}

      <div className="admin-form-card">
        <div className="admin-form-section-heading">
          <span className="admin-kicker">HERO</span>
          <h2>Homepage-এর প্রথম অংশ</h2>
        </div>

        <div className="admin-form-grid">
          {fields.slice(0, 6).map((field) => (
            <label key={field.key} className={field.multiline ? "full" : ""}>
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={4}
                  value={content[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              ) : (
                <input
                  value={content[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-section-heading">
          <span className="admin-kicker">QUOTE</span>
          <h2>Hero-এর নিচের বার্তা</h2>
        </div>
        <div className="admin-form-grid">
          {fields.slice(6, 8).map((field) => (
            <label key={field.key} className="full">
              <span>{field.label}</span>
              <textarea
                rows={3}
                value={content[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-section-heading">
          <span className="admin-kicker">ABOUT</span>
          <h2>Homepage-এর About section</h2>
        </div>
        <div className="admin-form-grid">
          {fields.slice(8, 13).map((field) => (
            <label key={field.key} className={field.multiline ? "full" : ""}>
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  rows={4}
                  value={content[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              ) : (
                <input
                  value={content[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-section-heading">
          <span className="admin-kicker">STATISTICS</span>
          <h2>Homepage statistics</h2>
        </div>
        <div className="admin-stat-edit-grid">
          {[1, 2, 3, 4].map((number) => {
            const valueKey = `stat_${number}_value` as keyof HomepageContent;
            const labelKey = `stat_${number}_label` as keyof HomepageContent;
            return (
              <div className="admin-stat-edit-card" key={number}>
                <strong>Statistic {number}</strong>
                <label>
                  <span>সংখ্যা</span>
                  <input
                    value={content[valueKey]}
                    onChange={(event) => updateField(valueKey, event.target.value)}
                  />
                </label>
                <label>
                  <span>নাম</span>
                  <input
                    value={content[labelKey]}
                    onChange={(event) => updateField(labelKey, event.target.value)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
        </button>
      </div>
    </section>
  );
}
