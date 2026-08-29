<?php
/**
 * Admin dashboard API.
 *
 * GET /api/dashboard.php?action=stats
 * Returns live counts from MySQL for the authenticated admin.
 */

require_once __DIR__ . '/helpers.php';
allow_cors();

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    send_json(['success' => false, 'message' => 'Server configuration is missing.'], 503);
}

$config = require $configFile;
$sessionName = $config['app']['session_name'] ?? 'shanti_sangha_admin';
session_name($sessionName);
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

if (empty($_SESSION['admin_id'])) {
    send_json(['success' => false, 'message' => 'Authentication required.'], 401);
}

$action = $_GET['action'] ?? 'stats';
if ($action !== 'stats' || $_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['success' => false, 'message' => 'Invalid dashboard request.'], 405);
}

try {
    require_once __DIR__ . '/db.php';
    $pdo = db();

    $queries = [
        'members' => 'SELECT COUNT(*) FROM membership_applications',
        'activities' => "SELECT COUNT(*) FROM activities WHERE is_published = 1",
        'donors' => "SELECT COUNT(*) FROM blood_donors WHERE status = 'approved' AND availability = 'available'",
        'requests' => "SELECT COUNT(*) FROM blood_requests WHERE status IN ('pending', 'approved')",
    ];

    $stats = [];
    foreach ($queries as $key => $sql) {
        $stats[$key] = (int) $pdo->query($sql)->fetchColumn();
    }

    send_json([
        'success' => true,
        'stats' => $stats,
    ]);
} catch (Throwable $error) {
    send_json(['success' => false, 'message' => 'ডাটাবেস থেকে তথ্য আনা যায়নি।'], 503);
}
