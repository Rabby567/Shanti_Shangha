import { FormEvent, useState } from "react";
import type { SiteSettings } from "../siteSettings";

export function ContactSection({ siteSettings }: { siteSettings?: SiteSettings }) {
  const email = siteSettings?.contact_email || "";
  const phone = siteSettings?.contact_phone || "";
  const address = siteSettings?.address || "";
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "ইমেইল পাঠানো যায়নি।");
      setStatus(data.message || "বার্তা পাঠানো হয়েছে।");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "ইমেইল পাঠানো যায়নি।");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="contact-section section-anchor">
      <div className="container">
        <div className="contact-card">
          <div className="contact-copy">
            <span className="section-kicker">যোগাযোগ করুন</span>
            <h2>মানবতার কাজে আমাদের সাথে থাকুন</h2>
            <p>প্রশ্ন, সহযোগিতা বা যেকোনো মানবিক উদ্যোগ নিয়ে সরাসরি আমাদের সাথে যোগাযোগ করুন।</p>
            <div className="contact-direct-actions">
              {email && <a href={`mailto:${email}`}>✉ {email}</a>}
              {phone && <a href={`tel:${phone}`}>☎ {phone}</a>}
            </div>
          </div>

          <form className="contact-form" onSubmit={submit}>
            <div className="contact-form-grid">
              <label>নাম *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" /></label>
              <label>ইমেইল *<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="আপনার ইমেইল" /></label>
              <label className="full">বিষয় *<input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="কী বিষয়ে যোগাযোগ করছেন?" /></label>
              <label className="full">বার্তা *<textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="আপনার বার্তা লিখুন..." /></label>
            </div>
            <button className="admin-primary-button contact-submit" type="submit" disabled={sending || !email}>
              {sending ? "পাঠানো হচ্ছে..." : "ইমেইল পাঠান →"}
            </button>
            {!email && <small className="contact-form-note">Admin Dashboard → Settings → Contact & Social থেকে mail recipient সেট করুন।</small>}
            {status && <div className="contact-form-status" role="status">{status}</div>}
          </form>
        </div>
      </div>
    </section>
  );
}
