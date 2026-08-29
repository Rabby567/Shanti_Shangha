<?php
/**
 * Admin authentication and account API.
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
allow_cors();

$config = require __DIR__ . '/config.php';
$sessionName = $config['app']['session_name'] ?? 'shanti_sangha_admin';

if (session_status() !== PHP_SESSION_ACTIVE) {
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

$action = $_GET['action'] ?? 'me';

function auth_public_admin(array $admin): array
{
    return [
        'id' => (int)$admin['id'],
        'name' => (string)$admin['name'],
        'email' => (string)$admin['email'],
        'phone' => (string)($admin['phone'] ?? ''),
        'avatar_path' => $admin['avatar_path'] ? (string)$admin['avatar_path'] : null,
        'role' => (string)$admin['role'],
        'is_active' => (bool)$admin['is_active'],
        'last_login_at' => $admin['last_login_at'] ?? null,
        'created_at' => $admin['created_at'] ?? null,
        'updated_at' => $admin['updated_at'] ?? null,
    ];
}

function clear_auth_session(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], '', $params['secure'], $params['httponly']);
    }
    session_destroy();
}

try {
    $pdo = db();

    if ($action === 'me' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        if (empty($_SESSION['admin_id'])) {
            send_json(['success' => true, 'authenticated' => false]);
        }

        $adminId = require_admin_session();

        $statement = $pdo->prepare(
            'SELECT id, name, email, phone, avatar_path, role, is_active, auth_version, last_login_at, created_at, updated_at
             FROM admins WHERE id = :id LIMIT 1'
        );
        $statement->execute(['id' => $adminId]);
        $admin = $statement->fetch();

        if (
            !$admin ||
            !(int)$admin['is_active'] ||
            (int)$admin['auth_version'] !== (int)($_SESSION['admin_auth_version'] ?? 0)
        ) {
            clear_auth_session();
            send_json(['success' => true, 'authenticated' => false]);
        }

        $_SESSION['admin_last_activity'] = time();
        send_json(['success' => true, 'authenticated' => true, 'admin' => auth_public_admin($admin)]);
    }

    if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        clear_auth_session();
        send_json(['success' => true, 'message' => 'Logged out successfully.']);
    }

    if ($action === 'logout-all' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $adminId = require_admin_session();
        $update = $pdo->prepare('UPDATE admins SET auth_version = auth_version + 1 WHERE id = :id');
        $update->execute(['id' => $adminId]);
        clear_auth_session();
        send_json(['success' => true, 'message' => 'সব active session logout করা হয়েছে।']);
    }

    if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = json_decode(file_get_contents('php://input'), true);
        $email = strtolower(trim((string)($payload['email'] ?? '')));
        $password = (string)($payload['password'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            send_json(['success' => false, 'message' => 'ইমেইল এবং পাসওয়ার্ড সঠিকভাবে দিন।'], 422);
        }

        $protection = get_site_setting('security_login_protection', '1') === '1';
        $limit = max(3, min(20, (int)get_site_setting('security_failed_login_limit', '5')));
        $ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64);

        if ($protection) {
            $check = $pdo->prepare(
                'SELECT COUNT(*) FROM login_attempts
                 WHERE email = :email AND was_successful = 0
                 AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)'
            );
            $check->execute(['email' => $email]);
            if ((int)$check->fetchColumn() >= $limit) {
                send_json(['success' => false, 'message' => 'অনেকবার ভুল login হয়েছে। 15 মিনিট পরে আবার চেষ্টা করুন।'], 429);
            }
        }

        $statement = $pdo->prepare(
            'SELECT id, name, email, phone, avatar_path, password_hash, role, is_active, auth_version
             FROM admins WHERE email = :email LIMIT 1'
        );
        $statement->execute(['email' => $email]);
        $admin = $statement->fetch();

        $valid = $admin && (int)$admin['is_active'] && password_verify($password, $admin['password_hash']);

        if (!$valid) {
            $insert = $pdo->prepare(
                'INSERT INTO login_attempts (email, ip_address, was_successful) VALUES (:email, :ip, 0)'
            );
            $insert->execute(['email' => $email, 'ip' => $ip]);
            $pdo->exec('DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');
            send_json(['success' => false, 'message' => 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।'], 401);
        }

        $insert = $pdo->prepare(
            'INSERT INTO login_attempts (email, ip_address, was_successful) VALUES (:email, :ip, 1)'
        );
        $insert->execute(['email' => $email, 'ip' => $ip]);
        $pdo->exec('DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)');

        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int)$admin['id'];
        $_SESSION['admin_name'] = $admin['name'];
        $_SESSION['admin_email'] = $admin['email'];
        $_SESSION['admin_role'] = $admin['role'];
        $_SESSION['admin_auth_version'] = (int)$admin['auth_version'];
        $_SESSION['admin_last_activity'] = time();

        $update = $pdo->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id');
        $update->execute(['id' => $admin['id']]);
        log_admin_activity($pdo, 'Auth', 'login', 'Admin dashboard-এ login করেছেন।', (int)$admin['id']);

        send_json([
            'success' => true,
            'authenticated' => true,
            'admin' => auth_public_admin(array_merge($admin, ['last_login_at' => date('Y-m-d H:i:s')])),
        ]);
    }

    if ($action === 'profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $adminId = require_admin_session();
        $name = trim((string)($_POST['name'] ?? ''));
        $email = strtolower(trim((string)($_POST['email'] ?? '')));
        $phone = trim((string)($_POST['phone'] ?? ''));
        $removeAvatar = ($_POST['remove_avatar'] ?? '0') === '1';

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            send_json(['success' => false, 'message' => 'নাম এবং valid email দিন।'], 422);
        }

        $statement = $pdo->prepare('SELECT avatar_path, auth_version FROM admins WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $adminId]);
        $current = $statement->fetch();
        if (!$current) send_json(['success'=>false,'message'=>'Admin account পাওয়া যায়নি।'],404);

        $duplicate = $pdo->prepare('SELECT id FROM admins WHERE email = :email AND id <> :id LIMIT 1');
        $duplicate->execute(['email'=>$email,'id'=>$adminId]);
        if ($duplicate->fetch()) send_json(['success'=>false,'message'=>'এই email অন্য একজন admin ব্যবহার করছেন।'],409);

        $avatarPath = $current['avatar_path'] ?? null;
        $newAvatar = null;
        if (isset($_FILES['avatar']) && (int)$_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            $newAvatar = save_admin_avatar($_FILES['avatar']);
            $avatarPath = $newAvatar;
        } elseif ($removeAvatar) {
            $avatarPath = null;
        }

        $update = $pdo->prepare(
            'UPDATE admins SET name=:name,email=:email,phone=:phone,avatar_path=:avatar_path WHERE id=:id'
        );
        $update->execute([
            'name'=>$name,'email'=>$email,'phone'=>$phone,'avatar_path'=>$avatarPath,'id'=>$adminId
        ]);

        if ($newAvatar || ($removeAvatar && !empty($current['avatar_path']))) {
            delete_uploaded_file($current['avatar_path']);
        }

        $_SESSION['admin_name'] = $name;
        $_SESSION['admin_email'] = $email;
        $_SESSION['admin_last_activity'] = time();

        $fresh = $pdo->prepare(
            'SELECT id,name,email,phone,avatar_path,role,is_active,last_login_at,created_at,updated_at,auth_version
             FROM admins WHERE id=:id LIMIT 1'
        );
        $fresh->execute(['id'=>$adminId]);
        $admin = $fresh->fetch();

        log_admin_activity($pdo, 'Auth', 'profile', 'নিজের admin profile আপডেট করেছেন।', $adminId);
        send_json(['success'=>true,'message'=>'Profile সফলভাবে আপডেট হয়েছে।','admin'=>auth_public_admin($admin)]);
    }

    if ($action === 'password' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $adminId = require_admin_session();
        $payload = json_decode(file_get_contents('php://input'), true);
        $currentPassword = (string)($payload['current_password'] ?? '');
        $newPassword = (string)($payload['new_password'] ?? '');

        if ($currentPassword === '' || mb_strlen($newPassword) < 8) {
            send_json(['success'=>false,'message'=>'Current password দিন এবং নতুন password কমপক্ষে 8 characters রাখুন।'],422);
        }

        $statement = $pdo->prepare('SELECT password_hash FROM admins WHERE id=:id LIMIT 1');
        $statement->execute(['id'=>$adminId]);
        $admin = $statement->fetch();

        if (!$admin || !password_verify($currentPassword, $admin['password_hash'])) {
            send_json(['success'=>false,'message'=>'Current password সঠিক নয়।'],401);
        }

        $update = $pdo->prepare(
            'UPDATE admins SET password_hash=:password_hash, auth_version=auth_version+1 WHERE id=:id'
        );
        $update->execute([
            'password_hash'=>password_hash($newPassword,PASSWORD_DEFAULT),
            'id'=>$adminId
        ]);

        clear_auth_session();
        send_json(['success'=>true,'message'=>'Password পরিবর্তন হয়েছে। নিরাপত্তার জন্য আবার login করুন।']);
    }

    send_json(['success'=>false,'message'=>'Invalid authentication request.'],405);
} catch (PDOException $error) {
    if ((int)($error->errorInfo[1] ?? 0) === 1062) {
        send_json(['success'=>false,'message'=>'এই email আগে থেকেই ব্যবহার হচ্ছে।'],409);
    }
    send_json(['success'=>false,'message'=>'সার্ভারে একটি সমস্যা হয়েছে।'],503);
} catch (Throwable $error) {
    send_json(['success'=>false,'message'=>$error->getMessage() ?: 'সার্ভারে একটি সমস্যা হয়েছে।'],503);
}
