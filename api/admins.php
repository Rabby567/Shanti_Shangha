<?php
/**
 * Super Admin management API.
 *
 * GET    /api/admins.php?action=list
 * POST   /api/admins.php?action=create
 * POST   /api/admins.php?action=update
 * POST   /api/admins.php?action=delete
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

allow_cors();
$sessionAdminId = require_super_admin();
$action = $_GET['action'] ?? 'list';

function admin_public_row(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => (string) $row['name'],
        'email' => (string) $row['email'],
        'phone' => (string) ($row['phone'] ?? ''),
        'avatar_path' => $row['avatar_path'] ? (string) $row['avatar_path'] : null,
        'role' => (string) $row['role'],
        'is_active' => (bool) $row['is_active'],
        'last_login_at' => $row['last_login_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

try {
    $pdo = db();

    if ($action === 'list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = $pdo->query(
            'SELECT id, name, email, phone, avatar_path, role, is_active, last_login_at, created_at, updated_at
             FROM admins ORDER BY id ASC'
        )->fetchAll();

        send_json([
            'success' => true,
            'admins' => array_map('admin_public_row', $rows),
        ]);
    }

    if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = $_POST;
        if (!$payload) {
            $payload = json_decode(file_get_contents('php://input'), true);
        }
        if (!is_array($payload)) {
            send_json(['success' => false, 'message' => 'Invalid admin data.'], 422);
        }

        $name = trim((string) ($payload['name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $phone = trim((string) ($payload['phone'] ?? ''));
        $password = (string) ($payload['password'] ?? '');
        $role = ($payload['role'] ?? 'admin') === 'super_admin' ? 'super_admin' : 'admin';
        $isActive = !isset($payload['is_active']) || (string) $payload['is_active'] === '1' || $payload['is_active'] === true;

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            send_json(['success' => false, 'message' => 'নাম, valid email এবং password দিন।'], 422);
        }

        if (mb_strlen($password) < 8) {
            send_json(['success' => false, 'message' => 'Password কমপক্ষে 8 characters হতে হবে।'], 422);
        }

        $exists = $pdo->prepare('SELECT id FROM admins WHERE email = :email LIMIT 1');
        $exists->execute(['email' => $email]);
        if ($exists->fetch()) {
            send_json(['success' => false, 'message' => 'এই email দিয়ে একটি admin আগে থেকেই আছে।'], 409);
        }

        $avatarPath = null;
        if (isset($_FILES['avatar']) && (int) $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            $avatarPath = save_admin_avatar($_FILES['avatar']);
        }

        $statement = $pdo->prepare(
            'INSERT INTO admins (name, email, phone, avatar_path, password_hash, role, is_active)
             VALUES (:name, :email, :phone, :avatar_path, :password_hash, :role, :is_active)'
        );
        $statement->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'avatar_path' => $avatarPath,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'role' => $role,
            'is_active' => $isActive ? 1 : 0,
        ]);

        send_json([
            'success' => true,
            'message' => 'নতুন admin সফলভাবে তৈরি হয়েছে।',
            'id' => (int) $pdo->lastInsertId(),
        ], 201);
    }

    if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = $_POST;
        if (!$payload) {
            $payload = json_decode(file_get_contents('php://input'), true);
        }
        if (!is_array($payload)) {
            send_json(['success' => false, 'message' => 'Invalid admin data.'], 422);
        }

        $id = (int) ($payload['id'] ?? 0);
        $name = trim((string) ($payload['name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $phone = trim((string) ($payload['phone'] ?? ''));
        $role = ($payload['role'] ?? 'admin') === 'super_admin' ? 'super_admin' : 'admin';
        $isActive = (bool) ($payload['is_active'] ?? false);

        if ($id < 1 || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            send_json(['success' => false, 'message' => 'Admin information সঠিকভাবে দিন।'], 422);
        }

        $target = $pdo->prepare('SELECT id, avatar_path, role, is_active FROM admins WHERE id = :id LIMIT 1');
        $target->execute(['id' => $id]);
        $existing = $target->fetch();

        if (!$existing) {
            send_json(['success' => false, 'message' => 'Admin পাওয়া যায়নি।'], 404);
        }

        if ($id === $sessionAdminId && !$isActive) {
            send_json(['success' => false, 'message' => 'নিজের account deactivate করা যাবে না।'], 422);
        }

        if ($existing['role'] === 'super_admin' && $role !== 'super_admin') {
            $count = (int) $pdo->query("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND is_active = 1")->fetchColumn();
            if ($count <= 1) {
                send_json(['success' => false, 'message' => 'কমপক্ষে একজন active Super Admin রাখতে হবে।'], 422);
            }
        }

        $duplicate = $pdo->prepare('SELECT id FROM admins WHERE email = :email AND id <> :id LIMIT 1');
        $duplicate->execute(['email' => $email, 'id' => $id]);
        if ($duplicate->fetch()) {
            send_json(['success' => false, 'message' => 'এই email অন্য একজন admin ব্যবহার করছেন।'], 409);
        }

        $avatarPath = $existing['avatar_path'] ?? null;
        $newAvatar = null;
        $removeAvatar = ($payload['remove_avatar'] ?? '0') === '1';

        if (isset($_FILES['avatar']) && (int) $_FILES['avatar']['error'] !== UPLOAD_ERR_NO_FILE) {
            $newAvatar = save_admin_avatar($_FILES['avatar']);
            $avatarPath = $newAvatar;
        } elseif ($removeAvatar) {
            $avatarPath = null;
        }

        $statement = $pdo->prepare(
            'UPDATE admins
             SET name = :name, email = :email, phone = :phone, avatar_path = :avatar_path, role = :role, is_active = :is_active, auth_version = auth_version + 1
             WHERE id = :id'
        );
        $statement->execute([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'avatar_path' => $avatarPath,
            'role' => $role,
            'is_active' => $isActive ? 1 : 0,
            'id' => $id,
        ]);

        if ($newAvatar || ($removeAvatar && !empty($existing['avatar_path']))) {
            delete_uploaded_file($existing['avatar_path'] ?? null);
        }

        if ($id === $sessionAdminId) {
            $_SESSION['admin_name'] = $name;
            $_SESSION['admin_email'] = $email;
            $_SESSION['admin_role'] = $role;
        }

        send_json(['success' => true, 'message' => 'Admin information আপডেট হয়েছে।']);
    }

    if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = json_decode(file_get_contents('php://input'), true);
        $id = (int) (($payload['id'] ?? 0));

        if ($id < 1 || $id === $sessionAdminId) {
            send_json(['success' => false, 'message' => 'নিজের account delete করা যাবে না।'], 422);
        }

        $target = $pdo->prepare('SELECT id, avatar_path, role FROM admins WHERE id = :id LIMIT 1');
        $target->execute(['id' => $id]);
        $existing = $target->fetch();

        if (!$existing) {
            send_json(['success' => false, 'message' => 'Admin পাওয়া যায়নি।'], 404);
        }

        if ($existing['role'] === 'super_admin') {
            $count = (int) $pdo->query("SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND is_active = 1")->fetchColumn();
            if ($count <= 1) {
                send_json(['success' => false, 'message' => 'শেষ active Super Admin delete করা যাবে না।'], 422);
            }
        }

        $statement = $pdo->prepare('DELETE FROM admins WHERE id = :id');
        $statement->execute(['id' => $id]);

        delete_uploaded_file($existing['avatar_path'] ?? null);

        send_json(['success' => true, 'message' => 'Admin account মুছে ফেলা হয়েছে।']);
    }

    send_json(['success' => false, 'message' => 'Invalid admin request.'], 405);
} catch (PDOException $error) {
    if ((int) $error->errorInfo[1] === 1062) {
        send_json(['success' => false, 'message' => 'এই email আগে থেকেই ব্যবহার হচ্ছে।'], 409);
    }
    send_json(['success' => false, 'message' => 'Admin operation সম্পন্ন করা যায়নি।'], 503);
} catch (Throwable $error) {
    send_json(['success' => false, 'message' => 'Admin operation সম্পন্ন করা যায়নি।'], 503);
}
