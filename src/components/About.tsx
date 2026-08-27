import { statistics } from "../data";
import { AnimatedStat } from "./AnimatedStat";

/**
 * About section.
 *
 * The left content column and right statistics column are intentionally
 * equal-width on desktop to match the reference layout.
 */
export function About() {
  return (
    <section id="about" className="about section-anchor">
      <div className="container">
        <div className="about-grid">
          <div className="about-copy">
            <div className="section-kicker">আমাদের সম্পর্কে</div>

            <h2>মানবতার সেবায় আমাদের পথচলা</h2>

            <p>
              শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদ একটি মানবিক ও সামাজিক সংগঠন।
              সমাজের অসহায়, দরিদ্র ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর
              উদ্দেশ্যে আমরা বিভিন্ন কার্যক্রম পরিচালনা করি।
            </p>

            <p>
              বৃক্ষরোপণ থেকে শুরু করে শীতবস্ত্র বিতরণ, রমজানে খাদ্যসামগ্রী
              বিতরণ, ঈদ উপহার এবং জরুরি প্রয়োজনে মানুষের পাশে দাঁড়ানো—
              আমাদের প্রতিটি কার্যক্রম মানবতার জন্য নিবেদিত।
            </p>

            <div className="about-quote">
              “এসো শান্তি সংঘ করি, মানবতার সেবা করি”
            </div>

            <button
              className="read-more"
              type="button"
              onClick={() => (window.location.hash = "/about")}
            >
              আরও পড়ুন <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="stats" aria-label="সংগঠনের পরিসংখ্যান">
            {statistics.map((stat) => (
              <AnimatedStat key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
