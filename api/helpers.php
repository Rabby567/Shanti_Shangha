<?php
/**
 * Small reusable HTTP helpers for the PHP API.
 */

function send_json(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function allow_cors(): void
{
    // The public site and API will normally share the same origin on cPanel.
    // Keep CORS restrictive when a separate development origin is required.
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $configFile = __DIR__ . '/config.php';

    if ($origin !== '' && is_file($configFile)) {
        $config = require $configFile;
        $allowed = rtrim($config['app']['url'] ?? '', '/');

        if ($allowed !== '' && rtrim($origin, '/') === $allowed) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
        }
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}



function get_site_setting(string $key, string $fallback = ''): string
{
    try {
        $pdo = db();
        $statement = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = :key LIMIT 1');
        $statement->execute(['key' => $key]);
        $value = $statement->fetchColumn();
        return $value === false ? $fallback : (string)$value;
    } catch (Throwable $e) {
        return $fallback;
    }
}

function admin_session_logout(): void
{
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

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
}

function require_admin_session(): int
{
    start_admin_session();

    if (empty($_SESSION['admin_id'])) {
        send_json(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    // Enforce configurable inactivity timeout.
    $timeoutMinutes = (int) get_site_setting('security_session_timeout', '120');
    $timeoutMinutes = max(15, min(1440, $timeoutMinutes));
    $lastActivity = (int) ($_SESSION['admin_last_activity'] ?? 0);
    if ($lastActivity > 0 && (time() - $lastActivity) > ($timeoutMinutes * 60)) {
        admin_session_logout();
        send_json(['success' => false, 'message' => 'Session timeout হয়েছে। আবার login করুন।'], 401);
    }

    $_SESSION['admin_last_activity'] = time();

    return (int) $_SESSION['admin_id'];
}

function current_admin_role(): string
{
    start_admin_session();
    return (string) ($_SESSION['admin_role'] ?? '');
}

function require_super_admin(): int
{
    $adminId = require_admin_session();

    if (current_admin_role() !== 'super_admin') {
        send_json(['success' => false, 'message' => 'এই কাজের জন্য Super Admin অনুমতি প্রয়োজন।'], 403);
    }

    return $adminId;
}

function save_admin_avatar(array $file): string
{
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('ছবি আপলোড করা যায়নি।');
    }

    if ((int) $file['size'] > 3 * 1024 * 1024) {
        throw new RuntimeException('Admin profile image সর্বোচ্চ 3MB হতে পারবে।');
    }

    $tmp = $file['tmp_name'];
    if (!is_uploaded_file($tmp)) {
        throw new RuntimeException('অবৈধ image upload।');
    }

    $info = @getimagesize($tmp);
    if ($info === false) {
        throw new RuntimeException('শুধু image file আপলোড করুন।');
    }

    $mime = $info['mime'] ?? '';
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowed[$mime])) {
        throw new RuntimeException('শুধু JPG, PNG অথবা WEBP image ব্যবহার করুন।');
    }

    $directory = dirname(__DIR__) . '/uploads/admins';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('Upload directory তৈরি করা যায়নি।');
    }

    $filename = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    $destination = $directory . '/' . $filename;

    if (!move_uploaded_file($tmp, $destination)) {
        throw new RuntimeException('Profile image save করা যায়নি।');
    }

    return '/uploads/admins/' . $filename;
}

function delete_uploaded_file(?string $relativePath): void
{
    if (!$relativePath || !str_starts_with($relativePath, '/uploads/')) {
        return;
    }

    $fullPath = dirname(__DIR__) . $relativePath;
    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}
