-- STEP 14: Gmail SMTP + footer location map settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_map_query', ''),
('site_map_zoom', '15'),
('smtp_enabled', '0'),
('smtp_host', 'smtp.gmail.com'),
('smtp_port', '587'),
('smtp_username', ''),
('smtp_password', ''),
('smtp_encryption', 'tls'),
('smtp_from_name', 'শান্তি সংঘ Website')
ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key);
