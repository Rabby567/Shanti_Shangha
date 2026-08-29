<?php
/**
 * Shanti Sangha API configuration template.
 *
 * Copy this file to api/config.php on the server and fill in the
 * credentials created from cPanel → MySQL Databases.
 *
 * IMPORTANT: config.php must never be committed to GitHub.
 */

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'CPANEL_DATABASE_NAME',
        'user' => 'CPANEL_DATABASE_USER',
        'password' => 'CHANGE_THIS_PASSWORD',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        // Use the exact production URL when the site goes live.
        'url' => 'https://example.com',
        // Change this to a long random value on the production server.
        'session_name' => 'shanti_sangha_admin',
        // Long random value used only by the one-time create-admin utility.
        'setup_token' => 'REPLACE_WITH_A_LONG_RANDOM_TOKEN',
    ],
];
