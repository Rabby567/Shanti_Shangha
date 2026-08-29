<?php
/**
 * Homepage content API.
 *
 * GET  /api/homepage.php?action=get
 * POST /api/homepage.php?action=save  (authenticated admin)
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
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

$action = $_GET['action'] ?? 'get';

$defaultContent = [
    'hero_eyebrow' => '❤️ মানবতার পাশে আমরা',
    'hero_title_line1' => 'এসো শান্তি সংঘ করি,',
    'hero_title_line2' => 'মানবতার সেবা করি',
    'hero_description' => 'অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।',
    'hero_primary_button' => 'সদস্য হোন',
    'hero_secondary_button' => '🩸 রক্তের আবেদন',
    'quote_title' => 'মানুষ মানুষের জন্য ❤️',
    'quote_description' => 'আপনার ছোট একটি সহযোগিতা কারও জীবনে বড় একটি পরিবর্তন আনতে পারে।',
    'about_kicker' => 'আমাদের সম্পর্কে',
    'about_title' => 'মানবতার সেবায় আমাদের পথচলা',
    'about_paragraph1' => 'শান্তি সংঘ যুব সমাজ কল্যাণ পরিষদ একটি মানবিক ও সামাজিক সংগঠন। সমাজের অসহায়, দরিদ্র ও সুবিধাবঞ্চিত মানুষের পাশে দাঁড়ানোর উদ্দেশ্যে আমরা বিভিন্ন কার্যক্রম পরিচালনা করি।',
    'about_paragraph2' => 'বৃক্ষরোপণ থেকে শুরু করে শীতবস্ত্র বিতরণ, রমজানে খাদ্যসামগ্রী বিতরণ, ঈদ উপহার এবং জরুরি প্রয়োজনে মানুষের পাশে দাঁড়ানো— আমাদের প্রতিটি কার্যক্রম মানবতার জন্য নিবেদিত।',
    'about_quote' => '“এসো শান্তি সংঘ করি, মানবতার সেবা করি”',
    'stat_1_value' => '১০০+',
    'stat_1_label' => 'সদস্য',
    'stat_2_value' => '৫০+',
    'stat_2_label' => 'মানবিক কার্যক্রম',
    'stat_3_value' => '২০০+',
    'stat_3_label' => 'উপকারভোগী',
    'stat_4_value' => '২৪/৭',
    'stat_4_label' => 'মানবিক সহযোগিতা',
];

try {
    $pdo = db();

    if ($action === 'get' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = $pdo->query(
            'SELECT content_key, content_value FROM homepage_content ORDER BY id ASC'
        )->fetchAll();

        $content = $defaultContent;
        foreach ($rows as $row) {
            $key = (string) $row['content_key'];
            if (array_key_exists($key, $defaultContent)) {
                $content[$key] = (string) ($row['content_value'] ?? '');
            }
        }

        send_json(['success' => true, 'content' => $content]);
    }

    if ($action !== 'save' || $_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(['success' => false, 'message' => 'Invalid homepage request.'], 405);
    }

    if (empty($_SESSION['admin_id'])) {
        send_json(['success' => false, 'message' => 'Authentication required.'], 401);
    }

    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload) || !isset($payload['content']) || !is_array($payload['content'])) {
        send_json(['success' => false, 'message' => 'Homepage content is required.'], 422);
    }

    $content = $payload['content'];
    $allowedKeys = array_keys($defaultContent);

    $pdo->beginTransaction();

    $statement = $pdo->prepare(
        'INSERT INTO homepage_content (content_key, content_value)
         VALUES (:content_key, :content_value)
         ON DUPLICATE KEY UPDATE
             content_value = VALUES(content_value)'
    );

    foreach ($allowedKeys as $key) {
        if (!array_key_exists($key, $content)) {
            continue;
        }

        $value = is_scalar($content[$key]) ? trim((string) $content[$key]) : '';
        $statement->execute([
            'content_key' => $key,
            'content_value' => $value,
        ]);
    }

    // Keep the global Settings > Homepage hero fields synchronized with
    // Homepage Management so there is only one effective source of truth.
    $siteStatement = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value)
         VALUES (:key, :value)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ([
        'homepage_hero_title_line1' => $content['hero_title_line1'] ?? '',
        'homepage_hero_title_line2' => $content['hero_title_line2'] ?? '',
        'homepage_hero_subtitle' => $content['hero_description'] ?? '',
    ] as $key => $value) {
        $siteStatement->execute([
            'key' => $key,
            'value' => trim((string) $value),
        ]);
    }

    $pdo->commit();

    send_json([
        'success' => true,
        'message' => 'Homepage content saved successfully.',
    ]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    send_json(['success' => false, 'message' => 'Homepage content save করা যায়নি।'], 503);
}
