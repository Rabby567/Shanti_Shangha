<?php
/** Public contact form mail delivery via configurable SMTP (Gmail supported). */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/smtp.php';
allow_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'POST request প্রয়োজন।'], 405);
}

try {
    $pdo = db();
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!is_array($payload)) $payload = $_POST;

    $name = trim((string)($payload['name'] ?? ''));
    $email = trim((string)($payload['email'] ?? ''));
    $subject = trim((string)($payload['subject'] ?? ''));
    $message = trim((string)($payload['message'] ?? ''));
    $to = trim((string)get_site_setting('site_contact_email', ''));
    $smtpEnabled = get_site_setting('smtp_enabled', '0') === '1';

    if ($name === '' || $email === '' || $subject === '' || $message === '') {
        send_json(['success' => false, 'message' => 'নাম, ইমেইল, বিষয় এবং বার্তা পূরণ করুন।'], 422);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json(['success' => false, 'message' => 'আপনার ইমেইল সঠিক নয়।'], 422);
    }
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        send_json(['success' => false, 'message' => 'Admin contact email এখনো সেট করা হয়নি।'], 503);
    }
    if (!$smtpEnabled) {
        send_json(['success' => false, 'message' => 'SMTP এখনো চালু করা হয়নি। Admin Dashboard → Settings → Contact & Social থেকে Gmail SMTP চালু করুন।'], 503);
    }

    $safeSubject = preg_replace('/[\r\n]+/', ' ', $subject);
    $body = "নাম: {$name}\nইমেইল: {$email}\n\nবার্তা:\n{$message}\n\nSent from Shanti Sangha website.";
    $smtp = [
        'host' => get_site_setting('smtp_host', 'smtp.gmail.com'),
        'port' => (int)get_site_setting('smtp_port', '587'),
        'username' => get_site_setting('smtp_username', ''),
        'password' => get_site_setting('smtp_password', ''),
        'encryption' => get_site_setting('smtp_encryption', 'tls'),
        'from_name' => get_site_setting('smtp_from_name', 'শান্তি সংঘ Website'),
    ];

    smtp_send_mail($smtp, $to, '[Shanti Sangha] ' . $safeSubject, $body, $email);
    send_json(['success' => true, 'message' => 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে।']);
} catch (Throwable $e) {
    error_log('[Shanti Sangha SMTP] ' . $e->getMessage());
    send_json(['success' => false, 'message' => 'ইমেইল পাঠানো যায়নি। SMTP host, port, Gmail এবং App Password পরীক্ষা করুন।'], 502);
}
