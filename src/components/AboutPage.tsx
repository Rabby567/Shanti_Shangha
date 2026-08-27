import { useState } from "react";

interface AboutPageProps {
  onBack: () => void;
}

const highlights = [
  { number: "০১", title: "মানবিকতা", description: "প্রয়োজনের সময় মানুষের পাশে দাঁড়ানো।" },
  { number: "০২", title: "স্বেচ্ছাসেবা", description: "তরুণদের স্বেচ্ছাসেবী কাজে সম্পৃক্ত করা।" },
  { number: "০৩", title: "সামাজিক দায়বদ্ধতা", description: "সমাজ ও পরিবেশের জন্য ইতিবাচক উদ্যোগ নেওয়া।" },
];

export function AboutPage({ onBack }: AboutPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="inner-page about-page">
      <section className="inner-page-hero">
        <div className="container">
          <button className="page-back" type="button" onClick={onBack}>← হোমে ফিরে যান</button>
          <div className="section-kicker">আমাদের সম্পর্কে</div>
          <h1>মানবতার সেবায় আমাদের পথচলা</h1>
          <p>শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদের লক্ষ্য, কার্যক্রম এবং মানবিক উদ্যোগ সম্পর্কে বিস্তারিত জানুন।</p>
        </div>
      </section>

      <section className="about-page-content">
        <div className="container">
          <div className="about-page-grid">
            <article className="about-page-copy">
              <div className="section-kicker">আমাদের পরিচয়</div>
              <h2>মানুষের পাশে, মানবতার জন্য</h2>
              <p>শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদ একটি মানবিক ও সামাজিক সংগঠন। সমাজের অসহায়, দরিদ্র ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর উদ্দেশ্যে আমরা বিভিন্ন সামাজিক ও মানবিক কার্যক্রম পরিচালনা করি।</p>
              <p>বৃক্ষরোপণ, চারা বিতরণ, খাদ্য ও ইফতার সামগ্রী বিতরণ, ধর্মীয় ও সামাজিক আয়োজন এবং জরুরি প্রয়োজনে মানুষের পাশে দাঁড়ানো—আমাদের কার্যক্রমের গুরুত্বপূর্ণ অংশ।</p>
              <p>স্বেচ্ছাসেবী তরুণদের অংশগ্রহণ ও সম্মিলিত সহযোগিতার মাধ্যমে মানুষের জন্য একটি সুন্দর, সহানুভূতিশীল ও মানবিক সমাজ গড়ে তোলাই আমাদের পথচলার মূল উদ্দেশ্য।</p>
              <div className="about-page-quote">“এসো শান্তি সংঘ করি, মানবতার সেবা করি”</div>
            </article>

            <aside className="about-page-highlights" aria-label="আমাদের মূলনীতি">
              {highlights.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div className={`about-highlight${isOpen ? " is-open" : ""}`} key={item.number}>
                    <button className="about-highlight-button" type="button" onClick={() => toggle(index)} aria-expanded={isOpen}>
                      <span className="about-highlight-number">{item.number}</span>
                      <span className="about-highlight-text">
                        <strong>{item.title}</strong>
                        {isOpen && <span className="about-highlight-description">{item.description}</span>}
                      </span>
                      <span className="about-highlight-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                    </button>
                  </div>
                );
              })}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
