-- Shanti Sangha - initial activity content
-- Import this ONCE after the activities table already exists.
-- Images are the current local demo placeholders.

USE shanti_sangha;

INSERT INTO activities
(title, slug, short_description, description, event_date, location, cover_image, is_published, sort_order)
VALUES
('বৃক্ষরোপণ কর্মসূচি', 'brikkhoropon-kormosuchi', 'পরিবেশ রক্ষায় নিয়মিত বৃক্ষরোপণ ও সচেতনতামূলক কার্যক্রম।',
'পরিবেশের ভারসাম্য রক্ষা এবং সবুজ প্রজন্ম গড়ে তোলার লক্ষ্যে শান্তি সংঘ নিয়মিত বৃক্ষরোপণ ও চারা পরিচর্যা কার্যক্রম পরিচালনা করে। শিক্ষার্থী, তরুণ এবং এলাকাবাসীকে সম্পৃক্ত করে বিভিন্ন স্থানে গাছ লাগানো হয় এবং গাছের পরিচর্যা সম্পর্কে সচেতনতা তৈরি করা হয়।',
NULL, '', '/images/activity-1.svg', 1, 1),
('ইফতার সামগ্রী বিতরণ', 'iftar-samagri-bitoron', 'রমজান মাসে অসহায় পরিবারের মাঝে ইফতার ও খাদ্যসামগ্রী বিতরণ।',
'রমজান মাসে অসহায় ও সুবিধাবঞ্চিত পরিবারের পাশে দাঁড়ানোর উদ্দেশ্যে শান্তি সংঘ ইফতার ও খাদ্যসামগ্রী বিতরণ করে। স্বেচ্ছাসেবকদের সহযোগিতায় প্রয়োজনীয় পরিবারের তালিকা তৈরি করে সম্মানজনকভাবে সহায়তা পৌঁছে দেওয়া হয়।',
NULL, '', '/images/activity-2.svg', 1, 2),
('অসহায় মানুষের পাশে', 'oshahay-manusher-pashe', 'দুঃস্থ ও অসহায় মানুষের প্রয়োজন অনুযায়ী সহযোগিতা করা।',
'মানবিক প্রয়োজনে মানুষের পাশে দাঁড়ানো আমাদের অন্যতম প্রধান লক্ষ্য। অসহায় পরিবার ও প্রয়োজনীয় মানুষের পরিস্থিতি বিবেচনা করে খাদ্য, জরুরি সহায়তা এবং অন্যান্য সহযোগিতা পৌঁছে দেওয়ার চেষ্টা করা হয়।',
NULL, '', '/images/activity-3.svg', 1, 3),
('চারা বিতরণ', 'chara-bitoron', 'শিক্ষার্থী ও এলাকাবাসীর মাঝে ফলজ ও বনজ গাছের চারা বিতরণ।',
'বৃক্ষরোপণের পাশাপাশি বাড়ি, শিক্ষা প্রতিষ্ঠান ও বিভিন্ন উপযুক্ত স্থানে গাছ লাগানোর সুযোগ তৈরি করতে ফলজ ও বনজ গাছের চারা বিতরণ করা হয়। তরুণদের পরিবেশবান্ধব উদ্যোগে যুক্ত করাই এই কর্মসূচির অন্যতম উদ্দেশ্য।',
NULL, '', '/images/activity-4.svg', 1, 4),
('ধর্মীয় ও সামাজিক আয়োজন', 'dhormio-o-samajik-ayojon', 'বদর দিবস উপলক্ষে ইফতার মাহফিল ও সামাজিক আয়োজন।',
'ধর্মীয় ও সামাজিক মূল্যবোধকে সামনে রেখে বিভিন্ন আয়োজন পরিচালনা করা হয়। পারস্পরিক সৌহার্দ্য, মানবিকতা এবং সামাজিক বন্ধনকে আরও শক্তিশালী করার উদ্দেশ্যে আলোচনা, ইফতার মাহফিল ও অন্যান্য সামাজিক কার্যক্রম আয়োজন করা হয়।',
NULL, '', '/images/activity-5.svg', 1, 5),
('রক্ত সেবা', 'rokto-seba', 'প্রয়োজনে রক্তদাতা খুঁজে দেওয়া এবং রক্তদানে উৎসাহিত করা।',
'জরুরি সময়ে রক্তের প্রয়োজন মেটাতে স্বেচ্ছায় রক্তদাতাদের সঙ্গে রোগী ও পরিবারের যোগাযোগ করিয়ে দেওয়ার উদ্যোগ নেওয়া হয়। নিয়মিত রক্তদানে উৎসাহিত করা এবং প্রয়োজনে দ্রুত রক্তদাতা খুঁজে দেওয়াই এই সেবার মূল লক্ষ্য।',
NULL, '', '/images/activity-6.svg', 1, 6);

-- Add the existing demo gallery images to the matching activities.
INSERT INTO activity_images (activity_id, file_path, caption, sort_order)
SELECT id, '/images/gallery-1.svg', 'বৃক্ষরোপণ', 0 FROM activities WHERE slug='brikkhoropon-kormosuchi'
UNION ALL SELECT id, '/images/gallery-2.svg', 'চারা রোপণ', 1 FROM activities WHERE slug='brikkhoropon-kormosuchi'
UNION ALL SELECT id, '/images/gallery-4.svg', 'বৃক্ষরোপণে অংশগ্রহণ', 2 FROM activities WHERE slug='brikkhoropon-kormosuchi'
UNION ALL SELECT id, '/images/gallery-5.svg', 'ইফতার মাহফিল', 0 FROM activities WHERE slug='iftar-samagri-bitoron'
UNION ALL SELECT id, '/images/gallery-6.svg', 'ইফতার সামগ্রী বিতরণ', 1 FROM activities WHERE slug='iftar-samagri-bitoron'
UNION ALL SELECT id, '/images/gallery-7.svg', 'বিতরণ কার্যক্রম', 2 FROM activities WHERE slug='iftar-samagri-bitoron'
UNION ALL SELECT id, '/images/gallery-7.svg', 'সহায়তা কার্যক্রম', 0 FROM activities WHERE slug='oshahay-manusher-pashe'
UNION ALL SELECT id, '/images/gallery-3.svg', 'সামাজিক উদ্যোগ', 1 FROM activities WHERE slug='oshahay-manusher-pashe'
UNION ALL SELECT id, '/images/gallery-6.svg', 'সহযোগিতা', 2 FROM activities WHERE slug='oshahay-manusher-pashe'
UNION ALL SELECT id, '/images/gallery-2.svg', 'চারা বিতরণ', 0 FROM activities WHERE slug='chara-bitoron'
UNION ALL SELECT id, '/images/gallery-3.svg', 'চারা', 1 FROM activities WHERE slug='chara-bitoron'
UNION ALL SELECT id, '/images/gallery-4.svg', 'বৃক্ষরোপণ', 2 FROM activities WHERE slug='chara-bitoron'
UNION ALL SELECT id, '/images/gallery-5.svg', 'ইফতার মাহফিল', 0 FROM activities WHERE slug='dhormio-o-samajik-ayojon'
UNION ALL SELECT id, '/images/gallery-8.svg', 'আলোচনা', 1 FROM activities WHERE slug='dhormio-o-samajik-ayojon'
UNION ALL SELECT id, '/images/gallery-9.svg', 'সামাজিক আয়োজন', 2 FROM activities WHERE slug='dhormio-o-samajik-ayojon'
UNION ALL SELECT id, '/images/gallery-7.svg', 'রক্ত সেবা', 0 FROM activities WHERE slug='rokto-seba'
UNION ALL SELECT id, '/images/gallery-6.svg', 'সহযোগিতা', 1 FROM activities WHERE slug='rokto-seba'
UNION ALL SELECT id, '/images/gallery-9.svg', 'স্বেচ্ছাসেবা', 2 FROM activities WHERE slug='rokto-seba';
