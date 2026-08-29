-- Shanti Sangha - Step 10 settings/security foundation
USE shanti_sangha;

SET @db := DATABASE();

SET @sql := IF(
  EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='admins' AND COLUMN_NAME='auth_version'),
  'SELECT 1',
  'ALTER TABLE admins ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER is_active'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  ip_address VARCHAR(64) NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  was_successful TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_login_email_time (email, attempted_at),
  INDEX idx_login_ip_time (ip_address, attempted_at)
) ENGINE=InnoDB;

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
('notify_email_enabled', '0')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Preserve existing custom hero copy from Homepage Management when it exists.
UPDATE site_settings s
JOIN homepage_content h ON h.content_key = 'hero_title_line1'
SET s.setting_value = h.content_value
WHERE s.setting_key = 'homepage_hero_title_line1'
  AND h.content_value IS NOT NULL AND h.content_value <> '';

UPDATE site_settings s
JOIN homepage_content h ON h.content_key = 'hero_title_line2'
SET s.setting_value = h.content_value
WHERE s.setting_key = 'homepage_hero_title_line2'
  AND h.content_value IS NOT NULL AND h.content_value <> '';

UPDATE site_settings s
JOIN homepage_content h ON h.content_key = 'hero_description'
SET s.setting_value = h.content_value
WHERE s.setting_key = 'homepage_hero_subtitle'
  AND h.content_value IS NOT NULL AND h.content_value <> '';
