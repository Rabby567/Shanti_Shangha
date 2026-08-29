-- ================================================================
-- Shanti Sangha - Step 9 Admin Management
-- Adds admin phone + profile image support.
-- Safe to run on an existing Step 8 database.
-- ================================================================

USE shanti_sangha;

SET @db := DATABASE();

SET @sql := IF(
    EXISTS(
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=@db AND TABLE_NAME='admins' AND COLUMN_NAME='phone'
    ),
    'SELECT 1',
    'ALTER TABLE admins ADD COLUMN phone VARCHAR(30) NULL AFTER email'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
    EXISTS(
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=@db AND TABLE_NAME='admins' AND COLUMN_NAME='avatar_path'
    ),
    'SELECT 1',
    'ALTER TABLE admins ADD COLUMN avatar_path VARCHAR(500) NULL AFTER phone'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- If this is the first admin-management migration and no Super Admin exists,
-- promote the oldest existing admin so the Settings > Admin Management area
-- is immediately usable.
SET @super_admin_count := (SELECT COUNT(*) FROM admins WHERE role = 'super_admin');
SET @sql := IF(
    @super_admin_count = 0,
    'UPDATE admins SET role = ''super_admin'' WHERE id = (SELECT id FROM (SELECT id FROM admins ORDER BY id ASC LIMIT 1) AS first_admin)',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
