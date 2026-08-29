import type { Activity, GalleryItem, NavItem, Stat } from "./types";

/**
 * Primary navigation shown in both desktop and mobile headers.
 */
export const navigation: NavItem[] = [
  { id: "about", label: "আমাদের সম্পর্কে" },
  { id: "activities", label: "কার্যক্রম" },
  { id: "gallery", label: "গ্যালারি" },
  { id: "member", label: "সদস্য হোন" },
  { id: "blood", label: "রক্ত সেবা" },
  { id: "donation", label: "অনুদান" },
];

/**
 * Activity cards.
 *
 * Images are intentionally local placeholders for now. Replace the
 * files in /public/images/ with the final photographs later.
 */
export const activities: Activity[] = [
  {
    number: "০১",
    icon: "🌱",
    title: "বৃক্ষরোপণ কর্মসূচি",
    description: "পরিবেশ রক্ষায় নিয়মিত বৃক্ষরোপণ ও সচেতনতামূলক কার্যক্রম।",
    image: "/images/activity-1.svg",
    details:
      "পরিবেশের ভারসাম্য রক্ষা এবং সবুজ প্রজন্ম গড়ে তোলার লক্ষ্যে শান্তি সংঘ নিয়মিত বৃক্ষরোপণ ও চারা পরিচর্যা কার্যক্রম পরিচালনা করে। শিক্ষার্থী, তরুণ এবং এলাকাবাসীকে সম্পৃক্ত করে বিভিন্ন স্থানে গাছ লাগানো হয় এবং গাছের পরিচর্যা সম্পর্কে সচেতনতা তৈরি করা হয়।",
    photos: ["/images/gallery-1.svg", "/images/gallery-2.svg", "/images/gallery-4.svg"],
  },
  {
    number: "০২",
    icon: "🌙",
    title: "ইফতার সামগ্রী বিতরণ",
    description: "রমজান মাসে অসহায় পরিবারের মাঝে ইফতার ও খাদ্যসামগ্রী বিতরণ।",
    image: "/images/activity-2.svg",
    details:
      "রমজান মাসে অসহায় ও সুবিধাবঞ্চিত পরিবারের পাশে দাঁড়ানোর উদ্দেশ্যে শান্তি সংঘ ইফতার ও খাদ্যসামগ্রী বিতরণ করে। স্বেচ্ছাসেবকদের সহযোগিতায় প্রয়োজনীয় পরিবারের তালিকা তৈরি করে সম্মানজনকভাবে সহায়তা পৌঁছে দেওয়া হয়।",
    photos: ["/images/gallery-5.svg", "/images/gallery-6.svg", "/images/gallery-7.svg"],
  },
  {
    number: "০৩",
    icon: "🤝",
    title: "অসহায় মানুষের পাশে",
    description: "দুঃস্থ ও অসহায় মানুষের প্রয়োজন অনুযায়ী সহযোগিতা করা।",
    image: "/images/activity-3.svg",
    details:
      "মানবিক প্রয়োজনে মানুষের পাশে দাঁড়ানো আমাদের অন্যতম প্রধান লক্ষ্য। অসহায় পরিবার ও প্রয়োজনীয় মানুষের পরিস্থিতি বিবেচনা করে খাদ্য, জরুরি সহায়তা এবং অন্যান্য সহযোগিতা পৌঁছে দেওয়ার চেষ্টা করা হয়।",
    photos: ["/images/gallery-7.svg", "/images/gallery-3.svg", "/images/gallery-6.svg"],
  },
  {
    number: "০৪",
    icon: "🌳",
    title: "চারা বিতরণ",
    description: "শিক্ষার্থী ও এলাকাবাসীর মাঝে ফলজ ও বনজ গাছের চারা বিতরণ।",
    image: "/images/activity-4.svg",
    details:
      "বৃক্ষরোপণের পাশাপাশি বাড়ি, শিক্ষা প্রতিষ্ঠান ও বিভিন্ন উপযুক্ত স্থানে গাছ লাগানোর সুযোগ তৈরি করতে ফলজ ও বনজ গাছের চারা বিতরণ করা হয়। তরুণদের পরিবেশবান্ধব উদ্যোগে যুক্ত করাই এই কর্মসূচির অন্যতম উদ্দেশ্য।",
    photos: ["/images/gallery-2.svg", "/images/gallery-3.svg", "/images/gallery-4.svg"],
  },
  {
    number: "০৫",
    icon: "🕌",
    title: "ধর্মীয় ও সামাজিক আয়োজন",
    description: "বদর দিবস উপলক্ষে ইফতার মাহফিল ও সামাজিক আয়োজন।",
    image: "/images/activity-5.svg",
    details:
      "ধর্মীয় ও সামাজিক মূল্যবোধকে সামনে রেখে বিভিন্ন আয়োজন পরিচালনা করা হয়। পারস্পরিক সৌহার্দ্য, মানবিকতা এবং সামাজিক বন্ধনকে আরও শক্তিশালী করার উদ্দেশ্যে আলোচনা, ইফতার মাহফিল ও অন্যান্য সামাজিক কার্যক্রম আয়োজন করা হয়।",
    photos: ["/images/gallery-5.svg", "/images/gallery-8.svg", "/images/gallery-9.svg"],
  },
  {
    number: "০৬",
    icon: "🩸",
    title: "রক্ত সেবা",
    description: "প্রয়োজনে রক্তদাতা খুঁজে দেওয়া এবং রক্তদানে উৎসাহিত করা।",
    image: "/images/activity-6.svg",
    details:
      "জরুরি সময়ে রক্তের প্রয়োজন মেটাতে স্বেচ্ছায় রক্তদাতাদের সঙ্গে রোগী ও পরিবারের যোগাযোগ করিয়ে দেওয়ার উদ্যোগ নেওয়া হয়। নিয়মিত রক্তদানে উৎসাহিত করা এবং প্রয়োজনে দ্রুত রক্তদাতা খুঁজে দেওয়াই এই সেবার মূল লক্ষ্য।",
    photos: ["/images/gallery-7.svg", "/images/gallery-6.svg", "/images/gallery-9.svg"],
  },
];

/**
 * About-section statistics.
 */
export const statistics: Stat[] = [
  { value: "১০০+", label: "সদস্য" },
  { value: "৫০+", label: "মানবিক কার্যক্রম" },
  { value: "২০০+", label: "উপকারভোগী" },
  { value: "২৪/৭", label: "মানবিক সহযোগিতা" },
];

/**
 * Gallery items.
 *
 * These use demo SVGs until the real event photographs are supplied.
 */
export const gallery: GalleryItem[] = [
  { title: "বৃক্ষরোপণ কর্মসূচি", image: "/images/gallery-1.svg" },
  { title: "চারা রোপণ", image: "/images/gallery-2.svg" },
  { title: "চারা বিতরণ", image: "/images/gallery-3.svg" },
  { title: "বৃক্ষরোপণে অংশগ্রহণ", image: "/images/gallery-4.svg" },
  { title: "ইফতার মাহফিল", image: "/images/gallery-5.svg" },
  { title: "ইফতার সামগ্রী বিতরণ", image: "/images/gallery-6.svg" },
  { title: "অসহায়দের মাঝে বিতরণ", image: "/images/gallery-7.svg" },
  { title: "বদর দিবসের আলোচনা", image: "/images/gallery-8.svg" },
  { title: "জামাতে নামাজ আদায়", image: "/images/gallery-9.svg" },
];

/**
 * Shared blood-group options.
 */
export const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
];
