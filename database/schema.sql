-- ================================================================
-- Shanti Sangha - MySQL database foundation
-- Compatible with MySQL 8+ / MariaDB 10.5+
-- ================================================================

CREATE DATABASE IF NOT EXISTS shanti_sangha
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shanti_sangha;

-- ---------------------------------------------------------------
-- Admin users
-- Passwords are stored as PHP password_hash() values, never plain text.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    phone VARCHAR(30) NULL,
    avatar_path VARCHAR(500) NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    auth_version INT UNSIGNED NOT NULL DEFAULT 1,
    last_login_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Login protection audit
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL,
    ip_address VARCHAR(64) NULL,
    attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    was_successful TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_login_email_time (email, attempted_at),
    INDEX idx_login_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT NULL,
    description LONGTEXT NULL,
    event_date DATE NULL,
    location VARCHAR(255) NULL,
    cover_image VARCHAR(500) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_activities_published (is_published),
    INDEX idx_activities_date (event_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT UNSIGNED NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    caption VARCHAR(255) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_images_activity
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_activity_images_activity (activity_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Activity YouTube videos
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- Gallery: image/video metadata. Actual files live in /uploads/.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NULL,
    caption TEXT NULL,
    media_type ENUM('image', 'video') NOT NULL DEFAULT 'image',
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500) NULL,
    category VARCHAR(120) NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_gallery_type (media_type),
    INDEX idx_gallery_published (is_published)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- About page accordion/content blocks
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS about_sections (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Homepage content/settings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS homepage_content (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    content_key VARCHAR(120) NOT NULL UNIQUE,
    content_value LONGTEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Blood requests
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(160) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    hospital VARCHAR(255) NULL,
    location VARCHAR(255) NULL,
    required_date DATE NULL,
    units_needed TINYINT UNSIGNED NOT NULL DEFAULT 1,
    details TEXT NULL,
    status ENUM('pending', 'approved', 'fulfilled', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blood_requests_group (blood_group),
    INDEX idx_blood_requests_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Registered blood donors
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_donors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    area VARCHAR(255) NULL,
    last_donation_date DATE NULL,
    donation_count INT UNSIGNED NOT NULL DEFAULT 0,
    availability ENUM('available', 'unavailable') NOT NULL DEFAULT 'available',
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_donors_group_status (blood_group, status),
    INDEX idx_donors_area (area),
    INDEX idx_donors_availability (availability)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Donors assigned to blood requests
-- One donor supplies one bag for one request.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_request_donors (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id BIGINT UNSIGNED NOT NULL,
    donor_id BIGINT UNSIGNED NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME NULL,
    donated_at DATETIME NULL,
    UNIQUE KEY uq_request_donor (request_id, donor_id),
    CONSTRAINT fk_brd_request FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_brd_donor FOREIGN KEY (donor_id) REFERENCES blood_donors(id) ON DELETE CASCADE,
    INDEX idx_brd_request (request_id),
    INDEX idx_brd_donor (donor_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Membership applications
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membership_applications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(190) NULL,
    address VARCHAR(500) NULL,
    father_name VARCHAR(160) NULL,
    mother_name VARCHAR(160) NULL,
    profession VARCHAR(160) NULL,
    blood_group VARCHAR(5) NULL,
    message TEXT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_members_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- General site settings
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(120) NOT NULL UNIQUE,
    setting_value LONGTEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_name', 'শান্তি সংঘ'),
('site_tagline', 'যুব সমাজ কল্যাণ পরিষদ'),
('site_logo_path', '/images/logo.svg'),
('site_favicon_path', '/images/logo.svg'),
('site_contact_phone', ''),
('site_contact_email', 'admin@shantishangha.org'),
('site_address', ''),
('site_facebook_url', ''),
('site_youtube_url', ''),
('site_instagram_url', ''),
('site_status', 'active'),
('homepage_hero_title_line1', 'এসো শান্তি সংঘ করি,'),
('homepage_hero_title_line2', 'মানবতার সেবা করি'),
('homepage_hero_subtitle', 'অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।'),
('homepage_hero_image', ''),
('homepage_about_enabled', '1'),
('homepage_activities_enabled', '1'),
('homepage_gallery_enabled', '1'),
('homepage_blood_enabled', '1'),
('homepage_statistics_enabled', '1'),
('security_session_timeout', '120'),
('security_login_protection', '1'),
('security_failed_login_limit', '5'),
('upload_max_size_mb', '8'),
('upload_allowed_formats', 'jpg,png,webp,gif'),
('upload_directory', '/uploads'),
('upload_optimization_enabled', '0'),
('notify_blood_request', '1'),
('notify_member_application', '1'),
('notify_activity', '1'),
('notify_donation', '1'),
('notify_email_enabled', '0')
ON DUPLICATE KEY UPDATE setting_value = setting_value;



-- ---------------------------------------------------------------
-- Admin notifications and per-admin read state
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(40) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NULL,
    entity_type VARCHAR(80) NULL,
    entity_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_created (created_at),
    INDEX idx_notifications_type (type)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id BIGINT UNSIGNED NOT NULL,
    admin_id BIGINT UNSIGNED NOT NULL,
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, admin_id),
    CONSTRAINT fk_notification_reads_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_reads_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Admin activity audit trail
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT UNSIGNED NOT NULL,
    module VARCHAR(80) NOT NULL,
    action VARCHAR(80) NOT NULL,
    description VARCHAR(500) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_activity_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_admin_activity_created (created_at),
    INDEX idx_admin_activity_admin (admin_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Donation submissions
-- ---------------------------------------------------------------
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

INSERT INTO site_settings (setting_key, setting_value)
VALUES (
    'donation_config',
    '{"enabled":true,"title":"মানবতার কাজে আপনার সহযোগিতা","description":"আপনার সামর্থ্য অনুযায়ী অনুদান দিয়ে আমাদের মানবিক কার্যক্রমে পাশে থাকুন।","bkash_number":"","bkash_label":"বিকাশ","nagad_number":"","nagad_label":"নগদ","bank_name":"","bank_account_name":"শান্তি সংঘ","bank_account_number":"","bank_branch":"","instruction":"অনুদান পাঠানোর পর নিচের ফর্মে আপনার পেমেন্টের তথ্য দিন।","form_fields":[]}'
)
ON DUPLICATE KEY UPDATE setting_value=setting_value;
