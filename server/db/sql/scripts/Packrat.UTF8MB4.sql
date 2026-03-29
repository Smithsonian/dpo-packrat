/**
 * Migration: Convert LATIN1 columns that receive user-provided filenames to UTF8MB4
 *
 * Root Cause:
 *   AssetVersion.StorageKeyStaging is CHARACTER SET LATIN1 but its value includes the
 *   original upload filename (e.g. "f65b5b13.../filename.zip"). When a filename contains
 *   Unicode characters (e.g. U+2010 HYPHEN instead of ASCII U+002D HYPHEN-MINUS),
 *   MariaDB rejects the INSERT with error 1366: "Incorrect string value".
 *
 * Scope:
 *   - ALTER DATABASE default charset to utf8mb4 (new tables inherit it automatically)
 *   - AssetVersion.StorageKeyStaging: LATIN1 → UTF8MB4 (includes filename, must support Unicode)
 *   - Asset.StorageKey: LATIN1 → UTF8MB4 (preventive — may include filename-derived paths)
 *
 * Columns left as LATIN1 (intentional — values are always pure ASCII):
 *   - AssetVersion.StorageHash (hex digest, 0-9 a-f only)
 *   - User.EmailAddress
 *   - Workflow.URL
 *
 * Run against both staging and production databases.
 * Estimated time: seconds (index rebuild on varchar columns).
 */

-- 1. Update the database default so future tables/columns inherit utf8mb4
ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. AssetVersion.StorageKeyStaging — the column that triggered the error
ALTER TABLE `AssetVersion`
    MODIFY COLUMN `StorageKeyStaging` varchar(512) CHARACTER SET utf8mb4 NOT NULL;

-- 3. Asset.StorageKey — preventive, storage keys can include filename-derived paths
ALTER TABLE `Asset`
    MODIFY COLUMN `StorageKey` varchar(512) CHARACTER SET utf8mb4 NULL;

-- 4. Verify the changes
SELECT TABLE_NAME, COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('StorageKeyStaging', 'StorageKey', 'StorageHash')
ORDER BY TABLE_NAME, COLUMN_NAME;
