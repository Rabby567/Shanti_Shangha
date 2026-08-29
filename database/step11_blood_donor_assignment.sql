-- Blood request donor assignment + donation count migration
USE shanti_sangha;

SET @has_count := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='blood_donors' AND COLUMN_NAME='donation_count');
SET @sql := IF(@has_count=0, 'ALTER TABLE blood_donors ADD COLUMN donation_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER last_donation_date', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

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
