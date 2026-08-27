import type { FormEvent } from "react";

import { bloodGroups } from "../data";

interface BloodServiceProps {
  onSubmit: (message: string) => void;
}

/**
 * Blood request and donor registration forms.
 */
export function BloodService({ onSubmit }: BloodServiceProps) {
  const handleBloodRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit("রক্তের আবেদন পাঠানো হয়েছে");
  };

  const handleDonorRegistration = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    onSubmit("রক্তদাতা হিসেবে যুক্ত হওয়া সম্পন্ন হয়েছে");
  };

  return (
    <section id="blood" className="blood-section section-anchor">
      <div className="container">
        <div className="section-heading centered light-heading">
          <div className="section-kicker">রক্ত সেবা</div>
          <h2>রক্তের প্রয়োজনে আমরা পাশে আছি</h2>
          <p>
            জরুরি রক্তের প্রয়োজন হলে আবেদন করুন অথবা রক্তদাতা হিসেবে যুক্ত
            হোন।
          </p>
        </div>

        <div className="blood-grid">
          <form className="blood-card" onSubmit={handleBloodRequest}>
            <div className="card-top">
              <span aria-hidden="true">🩸</span>

              <div>
                <h3>রক্তের জন্য আবেদন</h3>
                <p>
                  রোগীর প্রয়োজনীয় তথ্য দিয়ে আবেদন করুন। আমাদের টিম
                  রক্তদাতা খুঁজে পেতে সহযোগিতা করবে।
                </p>
              </div>
            </div>

            <div className="form-grid one-col">
              <label>
                রোগীর নাম *
                <input required />
              </label>

              <label>
                রক্তের গ্রুপ *
                <select required defaultValue="">
                  <option value="" disabled>
                    নির্বাচন করুন
                  </option>
                  {bloodGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>

              <label>
                কত ব্যাগ প্রয়োজন *
                <input required type="number" min="1" />
              </label>

              <label>
                হাসপাতাল
                <input />
              </label>

              <label>
                যোগাযোগের নম্বর *
                <input required />
              </label>
            </div>

            <button className="form-submit" type="submit">
              আবেদন পাঠান
            </button>
          </form>

          <form className="blood-card" onSubmit={handleDonorRegistration}>
            <div className="card-top">
              <span aria-hidden="true">❤️</span>

              <div>
                <h3>রক্তদাতা হিসেবে যুক্ত হোন</h3>
                <p>
                  নিয়মিত রক্তদাতা হয়ে একজন মানুষের জীবন বাঁচাতে আপনার
                  গুরুত্বপূর্ণ ভূমিকা রাখুন।
                </p>
              </div>
            </div>

            <div className="form-grid one-col">
              <label>
                নাম *
                <input required />
              </label>

              <label>
                রক্তের গ্রুপ *
                <select required defaultValue="">
                  <option value="" disabled>
                    নির্বাচন করুন
                  </option>
                  {bloodGroups.map((group) => (
                    <option key={group}>{group}</option>
                  ))}
                </select>
              </label>

              <label>
                এলাকা *
                <input required />
              </label>

              <label>
                মোবাইল নম্বর *
                <input required />
              </label>
            </div>

            <button className="form-submit" type="submit">
              রক্তদাতা হিসেবে যুক্ত হোন
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
