export type HomepageContent = {
  hero_eyebrow: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_description: string;
  hero_primary_button: string;
  hero_secondary_button: string;
  quote_title: string;
  quote_description: string;
  about_kicker: string;
  about_title: string;
  about_paragraph1: string;
  about_paragraph2: string;
  about_quote: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
  stat_3_value: string;
  stat_3_label: string;
  stat_4_value: string;
  stat_4_label: string;
};

export const defaultHomepageContent: HomepageContent = {
  hero_eyebrow: "❤️ মানবতার পাশে আমরা",
  hero_title_line1: "এসো শান্তি সংঘ করি,",
  hero_title_line2: "মানবতার সেবা করি",
  hero_description:
    "অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।",
  hero_primary_button: "সদস্য হোন",
  hero_secondary_button: "🩸 রক্তের আবেদন",
  quote_title: "মানুষ মানুষের জন্য ❤️",
  quote_description:
    "আপনার ছোট একটি সহযোগিতা কারও জীবনে বড় একটি পরিবর্তন আনতে পারে।",
  about_kicker: "আমাদের সম্পর্কে",
  about_title: "মানবতার সেবায় আমাদের পথচলা",
  about_paragraph1:
    "শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদ একটি মানবিক ও সামাজিক সংগঠন। সমাজের অসহায়, দরিদ্র ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর উদ্দেশ্যে আমরা বিভিন্ন কার্যক্রম পরিচালনা করি।",
  about_paragraph2:
    "বৃক্ষরোপণ থেকে শুরু করে শীতবস্ত্র বিতরণ, রমজানে খাদ্যসামগ্রী বিতরণ, ঈদ উপহার এবং জরুরি প্রয়োজনে মানুষের পাশে দাঁড়ানো— আমাদের প্রতিটি কার্যক্রম মানবতার জন্য নিবেদিত।",
  about_quote: "“এসো শান্তি সংঘ করি, মানবতার সেবা করি”",
  stat_1_value: "১০০+",
  stat_1_label: "সদস্য",
  stat_2_value: "৫০+",
  stat_2_label: "মানবিক কার্যক্রম",
  stat_3_value: "২০০+",
  stat_3_label: "উপকারভোগী",
  stat_4_value: "২৪/৭",
  stat_4_label: "মানবিক সহযোগিতা",
};

export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const response = await fetch("/api/homepage.php?action=get", {
      credentials: "include",
    });
    const data = await response.json();

    if (!response.ok || !data.success || !data.content) {
      throw new Error("Homepage content unavailable");
    }

    return { ...defaultHomepageContent, ...data.content };
  } catch {
    return defaultHomepageContent;
  }
}
