-- STEP 12: Donation service + YouTube activity videos
USE shanti_sangha;

CREATE TABLE IF NOT EXISTS donation_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    donor_name VARCHAR(160) NULL,
    phone VARCHAR(30) NULL,
    amount DECIMAL(12,2) NULL,
    payment_method VARCHAR(80) NULL,
    transaction_id VARCHAR(160) NULL,
    form_data LONGTEXT NULL,
    status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_donation_status (status),
    INDEX idx_donation_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_videos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NULL,
    youtube_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_videos_activity
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_activity_videos_activity (activity_id)
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value)
VALUES (
    'donation_config',
    '{"enabled":true,"title":"মানবতার কাজে আপনার সহযোগিতা","description":"আপনার সামর্থ্য অনুযায়ী অনুদান দিয়ে আমাদের মানবিক কার্যক্রমে পাশে থাকুন।","bkash_number":"","bkash_label":"বিকাশ","nagad_number":"","nagad_label":"নগদ","bank_name":"","bank_account_name":"শান্তি সংঘ","bank_account_number":"","bank_branch":"","instruction":"অনুদান পাঠানোর পর নিচের ফর্মে আপনার পেমেন্টের তথ্য দিন।","form_fields":[{"id":"donor_name","label":"দাতার নাম","type":"text","required":true,"enabled":true,"placeholder":"আপনার নাম"},{"id":"phone","label":"মোবাইল নম্বর","type":"tel","required":true,"enabled":true,"placeholder":"01XXXXXXXXX"},{"id":"amount","label":"অনুদানের পরিমাণ (টাকা)","type":"number","required":true,"enabled":true,"placeholder":"যেমন 1000"},{"id":"payment_method","label":"পেমেন্টের মাধ্যম","type":"select","required":true,"enabled":true,"options":["বিকাশ","নগদ","ব্যাংক"]},{"id":"transaction_id","label":"Transaction ID / Reference","type":"text","required":false,"enabled":true,"placeholder":"প্রযোজ্য হলে লিখুন"},{"id":"note","label":"অতিরিক্ত তথ্য","type":"textarea","required":false,"enabled":true,"placeholder":"কোনো বার্তা থাকলে লিখুন"}]}'
)
ON DUPLICATE KEY UPDATE setting_value=setting_value;
