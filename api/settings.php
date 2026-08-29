<?php
/**
 * Site / security / upload / notification settings API.
 *
 * GET  /api/settings.php?action=get
 * GET  /api/settings.php?action=public
 * GET  /api/settings.php?action=system
 * POST /api/settings.php?action=save-site
 * POST /api/settings.php?action=save-homepage
 * POST /api/settings.php?action=save-security
 * POST /api/settings.php?action=save-upload
 * POST /api/settings.php?action=save-notifications
 * POST /api/settings.php?action=asset
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/smtp.php';
allow_cors();

$action = $_GET['action'] ?? 'get';

$defaults = [
    'site_name' => 'শান্তি সংঘ',
    'site_tagline' => 'যুব সমাজ কল্যাণ পরিষদ',
    'site_logo_path' => '/images/logo.svg',
    'site_favicon_path' => '/images/logo.svg',
    'site_contact_phone' => '',
    'site_contact_email' => 'admin@shantishangha.org',
    'site_address' => '',
    'site_facebook_url' => '',
    'site_youtube_url' => '',
    'site_instagram_url' => '',
    'site_map_query' => '',
    'site_map_embed_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d901.8938851531643!2d89.22123638610354!3d24.975387869154122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39fcf7004f502853%3A0xd1f25d81589c19f9!2zU2hhbnRpIFNhbmdoYSAo4Ka24Ka-4Kao4KeN4Kak4Ka_IOCmuOCmguCmmCDgpq_gp4Hgpqwg4Ka44Kau4Ka-4KacIOCmleCmsuCnjeCmr-CmvuCmoyDgpqrgprDgpr_gprfgpqYpLCDgpqrgpr_gprDgpqwg4Kas4Ka-4Kac4Ka-4Kaw!5e1!3m2!1sen!2sbd!4v1788000871915!5m2!1sen!2sbd',
    'site_map_zoom' => '15',
    'smtp_enabled' => '0',
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => '587',
    'smtp_username' => '',
    'smtp_password' => '',
    'smtp_encryption' => 'tls',
    'smtp_from_name' => 'শান্তি সংঘ Website',
    'site_status' => 'active',

    'homepage_hero_title_line1' => 'এসো শান্তি সংঘ করি,',
    'homepage_hero_title_line2' => 'মানবতার সেবা করি',
    'homepage_hero_subtitle' => 'অসহায় মানুষের পাশে দাঁড়ানো, রক্তদান, বৃক্ষরোপণ, শীতবস্ত্র বিতরণ এবং বিভিন্ন মানবিক কার্যক্রমের মাধ্যমে একটি সুন্দর ও মানবিক সমাজ গড়ে তোলাই আমাদের লক্ষ্য।',
    'homepage_hero_image' => '',
    'homepage_about_enabled' => '1',
    'homepage_activities_enabled' => '1',
    'homepage_gallery_enabled' => '1',
    'homepage_blood_enabled' => '1',
    'homepage_statistics_enabled' => '1',

    'security_session_timeout' => '120',
    'security_login_protection' => '1',
    'security_failed_login_limit' => '5',

    'upload_max_size_mb' => '8',
    'upload_allowed_formats' => 'jpg,png,webp,gif',
    'upload_directory' => '/uploads',
    'upload_optimization_enabled' => '0',

    'notify_blood_request' => '1',
    'notify_member_application' => '1',
    'notify_activity' => '1',
    'notify_donation' => '1',
    'notify_email_enabled' => '0',
];

function settings_rows(PDO $pdo): array
{
    $rows = $pdo->query('SELECT setting_key, setting_value FROM site_settings')->fetchAll();
    $out = [];
    foreach ($rows as $row) {
        $out[(string)$row['setting_key']] = (string)($row['setting_value'] ?? '');
    }
    return $out;
}

function setting_value(PDO $pdo, string $key, string $fallback = ''): string
{
    $statement = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = :key LIMIT 1');
    $statement->execute(['key' => $key]);
    $value = $statement->fetchColumn();
    return $value === false ? $fallback : (string)$value;
}

function save_settings(PDO $pdo, array $values): void
{
    $statement = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value)
         VALUES (:key, :value)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($values as $key => $value) {
        $statement->execute([
            'key' => $key,
            'value' => is_scalar($value) ? trim((string)$value) : '',
        ]);
    }
}

function settings_payload(array $all): array
{
    $bool = static fn(string $key): bool => ($all[$key] ?? '0') === '1';
    return [
        'site' => [
            'name' => $all['site_name'] ?? '',
            'tagline' => $all['site_tagline'] ?? '',
            'logo_path' => $all['site_logo_path'] ?? '',
            'favicon_path' => $all['site_favicon_path'] ?? '',
            'contact_phone' => $all['site_contact_phone'] ?? '',
            'contact_email' => $all['site_contact_email'] ?? '',
            'address' => $all['site_address'] ?? '',
            'facebook_url' => $all['site_facebook_url'] ?? '',
            'youtube_url' => $all['site_youtube_url'] ?? '',
            'instagram_url' => $all['site_instagram_url'] ?? '',
            'map_query' => $all['site_map_query'] ?? '',
            'map_embed_url' => $all['site_map_embed_url'] ?? '',
            'map_zoom' => max(1, min(21, (int)($all['site_map_zoom'] ?? 15))),
            'status' => $all['site_status'] ?? 'active',
        ],
        'homepage' => [
            'hero_title_line1' => $all['homepage_hero_title_line1'] ?? '',
            'hero_title_line2' => $all['homepage_hero_title_line2'] ?? '',
            'hero_subtitle' => $all['homepage_hero_subtitle'] ?? '',
            'hero_image' => $all['homepage_hero_image'] ?? '',
            'about_enabled' => $bool('homepage_about_enabled'),
            'activities_enabled' => $bool('homepage_activities_enabled'),
            'gallery_enabled' => $bool('homepage_gallery_enabled'),
            'blood_enabled' => $bool('homepage_blood_enabled'),
            'statistics_enabled' => $bool('homepage_statistics_enabled'),
        ],
        'security' => [
            'session_timeout' => (int)($all['security_session_timeout'] ?? 120),
            'login_protection' => $bool('security_login_protection'),
            'failed_login_limit' => (int)($all['security_failed_login_limit'] ?? 5),
        ],
        'upload' => [
            'max_size_mb' => (int)($all['upload_max_size_mb'] ?? 8),
            'allowed_formats' => array_values(array_filter(array_map('trim', explode(',', $all['upload_allowed_formats'] ?? 'jpg,png,webp,gif')))),
            'directory' => $all['upload_directory'] ?? '/uploads',
            'optimization_enabled' => $bool('upload_optimization_enabled'),
        ],
        'smtp' => [
            'enabled' => $bool('smtp_enabled'),
            'host' => $all['smtp_host'] ?? 'smtp.gmail.com',
            'port' => (int)($all['smtp_port'] ?? 587),
            'username' => $all['smtp_username'] ?? '',
            'password' => '',
            'encryption' => $all['smtp_encryption'] ?? 'tls',
            'from_name' => $all['smtp_from_name'] ?? 'শান্তি সংঘ Website',
        ],
        'notifications' => [
            'blood_request' => $bool('notify_blood_request'),
            'member_application' => $bool('notify_member_application'),
            'activity' => $bool('notify_activity'),
            'donation' => $bool('notify_donation'),
            'email_enabled' => $bool('notify_email_enabled'),
        ],
    ];
}

function save_site_asset(string $type, array $file): string
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new RuntimeException('ফাইল আপলোড করা যায়নি।');
    }

    $maxBytes = 8 * 1024 * 1024;
    if ((int)$file['size'] > $maxBytes) {
        throw new RuntimeException('ফাইলের আকার সর্বোচ্চ 8MB হতে পারবে।');
    }

    $tmp = $file['tmp_name'] ?? '';
    if (!is_uploaded_file($tmp)) {
        throw new RuntimeException('অবৈধ file upload।');
    }

    $mime = '';
    if (($file['type'] ?? '') === 'image/svg+xml') {
        $mime = 'image/svg+xml';
    } else {
        $info = @getimagesize($tmp);
        if ($info !== false) {
            $mime = $info['mime'] ?? '';
        }
        if ($mime === '') {
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
        }
    }

    $allowed = $type === 'favicon'
        ? ['image/x-icon' => 'ico', 'image/vnd.microsoft.icon' => 'ico', 'image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp']
        : ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/svg+xml' => 'svg'];

    if (!isset($allowed[$mime])) {
        throw new RuntimeException($type === 'favicon'
            ? 'Favicon-এর জন্য ICO, PNG, JPG অথবা WEBP ব্যবহার করুন।'
            : 'Logo-এর জন্য JPG, PNG, WEBP অথবা SVG ব্যবহার করুন।');
    }

    $dir = dirname(__DIR__) . '/uploads/site';
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('Upload directory তৈরি করা যায়নি।');
    }

    $name = $type . '-' . bin2hex(random_bytes(12)) . '.' . $allowed[$mime];
    $destination = $dir . '/' . $name;
    if (!move_uploaded_file($tmp, $destination)) {
        throw new RuntimeException('ফাইল save করা যায়নি।');
    }

    return '/uploads/site/' . $name;
}

try {
    $pdo = db();

    if ($action === 'public' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $all = array_merge($defaults, settings_rows($pdo));
        send_json([
            'success' => true,
            'site' => settings_payload($all)['site'],
            'homepage' => settings_payload($all)['homepage'],
        ]);
    }

    if ($action === 'get' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        require_admin_session();
        $all = array_merge($defaults, settings_rows($pdo));
        send_json(['success' => true, 'settings' => settings_payload($all)]);
    }

    if ($action === 'system' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        require_admin_session();
        $uploadPath = dirname(__DIR__) . '/uploads';
        $system = [
            'database' => 'Connected',
            'api' => 'Connected',
            'php_version' => PHP_VERSION,
            'mysql_version' => (string)$pdo->query('SELECT VERSION()')->fetchColumn(),
            'application_version' => '1.0.0',
            'upload_directory' => is_dir($uploadPath) && is_writable($uploadPath) ? 'Ready' : 'Not writable',
            'gd' => extension_loaded('gd') ? 'Available' : 'Not available',
        ];
        send_json(['success' => true, 'system' => $system]);
    }

    require_super_admin();

    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) $payload = $_POST;

    if (in_array($action, ['save-site', 'save-homepage', 'save-security', 'save-upload', 'save-notifications', 'save-contact-social', 'save-location', 'save-smtp', 'test-smtp'], true)) {
        if (!is_array($payload)) {
            send_json(['success' => false, 'message' => 'Settings data প্রয়োজন।'], 422);
        }

        $values = [];
        if ($action === 'test-smtp') {
            if (get_site_setting('smtp_enabled', '0') !== '1') {
                send_json(['success'=>false,'message'=>'আগে Gmail SMTP চালু করুন।'],422);
            }
            $to = trim((string)get_site_setting('site_contact_email', ''));
            if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
                send_json(['success'=>false,'message'=>'আগে Contact Email/recipient সঠিকভাবে সেট করুন।'],422);
            }
            $smtp = [
                'host' => get_site_setting('smtp_host', 'smtp.gmail.com'),
                'port' => (int)get_site_setting('smtp_port', '587'),
                'username' => get_site_setting('smtp_username', ''),
                'password' => get_site_setting('smtp_password', ''),
                'encryption' => get_site_setting('smtp_encryption', 'tls'),
                'from_name' => get_site_setting('smtp_from_name', 'শান্তি সংঘ Website'),
            ];
            smtp_send_mail($smtp, $to, 'Shanti Sangha SMTP Test', "SMTP test সফল হয়েছে।

Shanti Sangha website mail delivery is working correctly.");
            log_admin_activity($pdo, 'Settings', 'test-smtp', 'SMTP test email পাঠানো হয়েছে।');
            send_json(['success'=>true,'message'=>'Test email সফলভাবে পাঠানো হয়েছে।']);
        } elseif ($action === 'save-site') {
            $email = trim((string)($payload['contact_email'] ?? ''));
            $facebook = trim((string)($payload['facebook_url'] ?? ''));
            $youtube = trim((string)($payload['youtube_url'] ?? ''));
            $instagram = trim((string)($payload['instagram_url'] ?? ''));
            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                send_json(['success' => false, 'message' => 'Contact email সঠিক নয়।'], 422);
            }
            if ($facebook !== '' && !filter_var($facebook, FILTER_VALIDATE_URL)) send_json(['success' => false, 'message' => 'Facebook URL সঠিক নয়।'], 422);
            if ($youtube !== '' && !filter_var($youtube, FILTER_VALIDATE_URL)) send_json(['success' => false, 'message' => 'YouTube URL সঠিক নয়।'], 422);
            if ($instagram !== '' && !filter_var($instagram, FILTER_VALIDATE_URL)) send_json(['success' => false, 'message' => 'Instagram URL সঠিক নয়।'], 422);
            $values = [
                'site_name' => trim((string)($payload['name'] ?? '')),
                'site_tagline' => trim((string)($payload['tagline'] ?? '')),
                'site_contact_phone' => trim((string)($payload['contact_phone'] ?? '')),
                'site_contact_email' => $email,
                'site_address' => trim((string)($payload['address'] ?? '')),
                'site_facebook_url' => $facebook,
                'site_youtube_url' => $youtube,
                'site_instagram_url' => $instagram,
                'site_status' => (($payload['status'] ?? 'active') === 'maintenance') ? 'maintenance' : 'active',
            ];
            if ($values['site_name'] === '') send_json(['success'=>false,'message'=>'Website name দিতে হবে।'],422);
        } elseif ($action === 'save-contact-social') {
            $email = trim((string)($payload['contact_email'] ?? ''));
            $facebook = trim((string)($payload['facebook_url'] ?? ''));
            $youtube = trim((string)($payload['youtube_url'] ?? ''));
            $instagram = trim((string)($payload['instagram_url'] ?? ''));
            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                send_json(['success' => false, 'message' => 'Mail recipient / Gmail সঠিকভাবে দিন।'], 422);
            }
            foreach ([['Facebook', $facebook], ['YouTube', $youtube], ['Instagram', $instagram]] as [$label, $url]) {
                if ($url !== '' && !filter_var($url, FILTER_VALIDATE_URL)) {
                    send_json(['success' => false, 'message' => $label . ' URL সঠিক নয়।'], 422);
                }
            }
            $values = [
                'site_contact_phone' => trim((string)($payload['contact_phone'] ?? '')),
                'site_contact_email' => $email,
                'site_facebook_url' => $facebook,
                'site_youtube_url' => $youtube,
                'site_instagram_url' => $instagram,
            ];
        } elseif ($action === 'save-location') {
            $mapQuery = trim((string)($payload['map_query'] ?? ''));
            $mapEmbed = trim((string)($payload['map_embed_url'] ?? ''));
            if (preg_match('/<iframe[^>]+src=[\"\']([^\"\']+)[\"\']/i', $mapEmbed, $m)) { $mapEmbed = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'); }
            if ($mapEmbed !== '' && !preg_match('#^https://www\.google\.com/maps/embed\?[^\s]+$#i', $mapEmbed)) {
                throw new RuntimeException('Google Maps embed URL সঠিক নয়। Google Maps-এর Share → Embed a map থেকে iframe-এর src দিন।');
            }
            $zoom = max(1, min(21, (int)($payload['map_zoom'] ?? 15)));
            $values = [
                'site_map_query' => $mapQuery,
                'site_map_embed_url' => $mapEmbed,
                'site_map_zoom' => (string)$zoom,
                'site_address' => trim((string)($payload['address'] ?? '')),
            ];
        } elseif ($action === 'save-smtp') {
            $username = trim((string)($payload['username'] ?? ''));
            $password = (string)($payload['password'] ?? '');
            $host = trim((string)($payload['host'] ?? 'smtp.gmail.com'));
            $port = max(1, min(65535, (int)($payload['port'] ?? 587)));
            $encryption = strtolower(trim((string)($payload['encryption'] ?? 'tls')));
            if ($username !== '' && !filter_var($username, FILTER_VALIDATE_EMAIL)) {
                send_json(['success'=>false,'message'=>'SMTP Gmail সঠিক নয়।'],422);
            }
            if (!in_array($encryption, ['tls','ssl','none'], true)) {
                send_json(['success'=>false,'message'=>'SMTP encryption সঠিক নয়।'],422);
            }
            if ($host === '') send_json(['success'=>false,'message'=>'SMTP host দিতে হবে।'],422);
            $values = [
                'smtp_enabled' => !empty($payload['enabled']) ? '1' : '0',
                'smtp_host' => $host,
                'smtp_port' => (string)$port,
                'smtp_username' => $username,
                'smtp_encryption' => $encryption,
                'smtp_from_name' => trim((string)($payload['from_name'] ?? 'শান্তি সংঘ Website')),
            ];
            if ($password !== '') $values['smtp_password'] = $password;
        } elseif ($action === 'save-homepage') {
            $values = [
                'homepage_hero_title_line1' => trim((string)($payload['hero_title_line1'] ?? '')),
                'homepage_hero_title_line2' => trim((string)($payload['hero_title_line2'] ?? '')),
                'homepage_hero_subtitle' => trim((string)($payload['hero_subtitle'] ?? '')),
                'homepage_about_enabled' => !empty($payload['about_enabled']) ? '1' : '0',
                'homepage_activities_enabled' => !empty($payload['activities_enabled']) ? '1' : '0',
                'homepage_gallery_enabled' => !empty($payload['gallery_enabled']) ? '1' : '0',
                'homepage_blood_enabled' => !empty($payload['blood_enabled']) ? '1' : '0',
                'homepage_statistics_enabled' => !empty($payload['statistics_enabled']) ? '1' : '0',
            ];
            if ($values['homepage_hero_title_line1'] === '' && $values['homepage_hero_title_line2'] === '') send_json(['success'=>false,'message'=>'Hero title দিতে হবে।'],422);
        } elseif ($action === 'save-security') {
            $timeout = max(15, min(1440, (int)($payload['session_timeout'] ?? 120)));
            $limit = max(3, min(20, (int)($payload['failed_login_limit'] ?? 5)));
            $values = [
                'security_session_timeout' => (string)$timeout,
                'security_login_protection' => !empty($payload['login_protection']) ? '1' : '0',
                'security_failed_login_limit' => (string)$limit,
            ];
        } elseif ($action === 'save-upload') {
            $max = max(1, min(50, (int)($payload['max_size_mb'] ?? 8)));
            $formats = array_values(array_intersect(
                ['jpg','png','webp','gif'],
                array_map('strtolower', (array)($payload['allowed_formats'] ?? []))
            ));
            if (!$formats) send_json(['success'=>false,'message'=>'কমপক্ষে একটি image format নির্বাচন করুন।'],422);
            $values = [
                'upload_max_size_mb' => (string)$max,
                'upload_allowed_formats' => implode(',', $formats),
                'upload_directory' => '/uploads',
                'upload_optimization_enabled' => !empty($payload['optimization_enabled']) ? '1' : '0',
            ];
        } else {
            $values = [
                'notify_blood_request' => !empty($payload['blood_request']) ? '1' : '0',
                'notify_member_application' => !empty($payload['member_application']) ? '1' : '0',
                'notify_activity' => !empty($payload['activity']) ? '1' : '0',
                'notify_donation' => !empty($payload['donation']) ? '1' : '0',
                'notify_email_enabled' => !empty($payload['email_enabled']) ? '1' : '0',
            ];
        }

        save_settings($pdo, $values);
        log_admin_activity($pdo, 'Settings', $action, 'Settings configuration আপডেট করা হয়েছে।');

        if ($action === 'save-homepage') {
            $sync = $pdo->prepare(
                'INSERT INTO homepage_content (content_key, content_value)
                 VALUES (:key, :value)
                 ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)'
            );
            $sync->execute(['key' => 'hero_title_line1', 'value' => $values['homepage_hero_title_line1']]);
            $sync->execute(['key' => 'hero_title_line2', 'value' => $values['homepage_hero_title_line2']]);
            $sync->execute(['key' => 'hero_description', 'value' => $values['homepage_hero_subtitle']]);
        }

        send_json(['success'=>true,'message'=>'Settings সফলভাবে সংরক্ষণ হয়েছে।']);
    }

    if ($action === 'asset' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $type = ($_POST['type'] ?? '') === 'favicon' ? 'favicon' : (($_POST['type'] ?? '') === 'hero' ? 'hero' : 'logo');
        $path = save_site_asset($type, $_FILES['file'] ?? []);
        $key = $type === 'logo' ? 'site_logo_path' : ($type === 'favicon' ? 'site_favicon_path' : 'homepage_hero_image');
        $old = setting_value($pdo, $key, '');
        save_settings($pdo, [$key => $path]);
        log_admin_activity($pdo, 'Settings', 'asset', ucfirst($type) . ' asset আপডেট করা হয়েছে।');
        delete_uploaded_file($old);
        send_json(['success'=>true,'message'=>'Image সফলভাবে আপলোড হয়েছে।','path'=>$path]);
    }

    send_json(['success'=>false,'message'=>'Invalid settings request.'],405);
} catch (Throwable $error) {
    send_json(['success'=>false,'message'=>$error->getMessage() ?: 'Settings operation সম্পন্ন করা যায়নি।'],503);
}
