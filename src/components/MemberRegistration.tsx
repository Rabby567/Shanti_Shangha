import type { FormEvent } from "react";

interface MemberRegistrationProps {
  onSubmit: (message: string) => void;
}

/**
 * Membership registration form.
 *
 * The current submit handler is intentionally presentation-only.
 * It can later be connected to an API/database without changing
 * the layout.
 */
export function MemberRegistration({
  onSubmit,
}: MemberRegistrationProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit("সদস্য নিবন্ধন সফল হয়েছে");
  };

  return (
    <section id="member" className="member section-anchor">
      <div className="container member-layout">
        <div className="member-intro">
          <div className="section-kicker">সদস্য নিবন্ধন</div>

          <h2>শান্তি সংঘের সদস্য হোন</h2>

          <p>
            মানবতার সেবায় আমাদের সঙ্গে যুক্ত হতে নিচের ফর্মটি পূরণ করুন।
            আপনার অংশগ্রহণ আমাদের কার্যক্রমকে আরও শক্তিশালী করবে।
          </p>

          <div className="mini-points">
            <span>❤ মানবতার সেবা</span>
            <span>🤝 একসাথে কাজ</span>
            <span>🌱 সমাজের উন্নয়ন</span>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              পূর্ণ নাম *
              <input required placeholder="আপনার নাম" />
            </label>

            <label>
              মোবাইল নম্বর *
              <input required placeholder="01XXXXXXXXX" />
            </label>

            <label>
              বাবার নাম *
              <input required />
            </label>

            <label>
              মায়ের নাম *
              <input required />
            </label>

            <label>
              পেশা
              <input />
            </label>

            <label>
              রক্তের গ্রুপ *
              <select required defaultValue="">
                <option value="" disabled>
                  নির্বাচন করুন
                </option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </label>

            <label className="full">
              ঠিকানা *
              <input required />
            </label>

            <label className="full">
              আপনার সম্পর্কে / অতিরিক্ত তথ্য
              <textarea rows={4} />
            </label>
          </div>

          <button className="form-submit" type="submit">
            সদস্য নিবন্ধন করুন →
          </button>
        </form>
      </div>
    </section>
  );
}
