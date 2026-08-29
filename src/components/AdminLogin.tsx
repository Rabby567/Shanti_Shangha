import { FormEvent, useState } from "react";

interface AdminLoginProps {
  onLogin: () => void;
  onBackToWebsite?: () => void;
}

const API_BASE = "/api";

/**
 * Secure admin login screen.
 *
 * Authentication is handled by the PHP API. The browser never stores the
 * admin password; PHP creates an HttpOnly session cookie after login.
 */
export function AdminLogin({ onLogin, onBackToWebsite }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth.php?action=login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "লগইন করা যায়নি।");
        return;
      }

      onLogin();
    } catch {
      setError("সার্ভারের সাথে সংযোগ করা যাচ্ছে না।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <button
          className="admin-login-brand admin-login-brand-button"
          type="button"
          onClick={onBackToWebsite}
          aria-label="ওয়েবসাইটের মূল পাতায় যান"
        >
          <img src="/images/logo.svg" alt="শান্তি সংঘ" />
          <span>Admin Panel</span>
        </button>

        <div className="admin-login-heading">
          <p>স্বাগতম</p>
          <h1 id="admin-login-title">অ্যাডমিন লগইন</h1>
          <span>ড্যাশবোর্ডে প্রবেশ করতে আপনার account দিয়ে login করুন।</span>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label>
            ইমেইল
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            পাসওয়ার্ড
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="আপনার পাসওয়ার্ড"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="admin-login-error" role="alert">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "লগইন হচ্ছে..." : "লগইন করুন"}
          </button>
        </form>

        <p className="admin-login-note">শুধু অনুমোদিত প্রশাসকদের জন্য।</p>
      </section>
    </main>
  );
}
