<?php
/**
 * Donation service API.
 *
 * Public:
 *   GET  /api/donation.php?action=public
 *   POST /api/donation.php?action=submit
 *
 * Admin:
 *   GET  /api/donation.php?action=admin-config
 *   POST /api/donation.php?action=save-config
 *   GET  /api/donation.php?action=submissions
 *   POST /api/donation.php?action=submission-status
 *   POST /api/donation.php?action=delete-submission
 */
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
allow_cors();

$defaultFields = [
    ['id'=>'donor_name','label'=>'দাতার নাম','type'=>'text','required'=>true,'enabled'=>true,'placeholder'=>'আপনার নাম'],
    ['id'=>'phone','label'=>'মোবাইল নম্বর','type'=>'tel','required'=>true,'enabled'=>true,'placeholder'=>'01XXXXXXXXX'],
    ['id'=>'amount','label'=>'অনুদানের পরিমাণ (টাকা)','type'=>'number','required'=>true,'enabled'=>true,'placeholder'=>'যেমন 1000'],
    ['id'=>'payment_method','label'=>'পেমেন্টের মাধ্যম','type'=>'select','required'=>true,'enabled'=>true,'options'=>['বিকাশ','নগদ','ব্যাংক']],
    ['id'=>'transaction_id','label'=>'Transaction ID / Reference','type'=>'text','required'=>false,'enabled'=>true,'placeholder'=>'প্রযোজ্য হলে লিখুন'],
    ['id'=>'note','label'=>'অতিরিক্ত তথ্য','type'=>'textarea','required'=>false,'enabled'=>true,'placeholder'=>'কোনো বার্তা থাকলে লিখুন'],
];

$defaultConfig = [
    'enabled' => true,
    'title' => 'মানবতার কাজে আপনার সহযোগিতা',
    'description' => 'আপনার সামর্থ্য অনুযায়ী অনুদান দিয়ে আমাদের মানবিক কার্যক্রমে পাশে থাকুন।',
    'bkash_number' => '',
    'bkash_label' => 'বিকাশ',
    'nagad_number' => '',
    'nagad_label' => 'নগদ',
    'bank_name' => '',
    'bank_account_name' => 'শান্তি সংঘ',
    'bank_account_number' => '',
    'bank_branch' => '',
    'instruction' => 'অনুদান পাঠানোর পর নিচের ফর্মে আপনার পেমেন্টের তথ্য দিন।',
    'form_fields' => $defaultFields,
];

function read_json_payload(): array {
    $payload = json_decode(file_get_contents('php://input'), true);
    return is_array($payload) ? $payload : [];
}

function decode_config(PDO $pdo): array {
    global $defaultConfig;
    $raw = get_site_setting('donation_config', '');
    if ($raw === '') return $defaultConfig;
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) return $defaultConfig;
    return array_replace($defaultConfig, $decoded);
}

function normalize_fields($fields): array {
    global $defaultFields;
    if (!is_array($fields)) return $defaultFields;
    $allowedTypes = ['text','tel','email','number','date','select','textarea'];
    $out = [];
    foreach ($fields as $index => $field) {
        if (!is_array($field)) continue;
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '_', (string)($field['id'] ?? 'field_'.$index));
        if ($id === '') $id = 'field_'.$index;
        $type = (string)($field['type'] ?? 'text');
        if (!in_array($type, $allowedTypes, true)) $type = 'text';
        $item = [
            'id' => $id,
            'label' => trim((string)($field['label'] ?? '')),
            'type' => $type,
            'required' => !empty($field['required']),
            'enabled' => !isset($field['enabled']) || !empty($field['enabled']),
            'placeholder' => trim((string)($field['placeholder'] ?? '')),
        ];
        if ($type === 'select') {
            $options = [];
            foreach ((array)($field['options'] ?? []) as $option) {
                $option = trim((string)$option);
                if ($option !== '') $options[] = $option;
            }
            $item['options'] = $options;
        }
        if ($item['label'] !== '') $out[] = $item;
    }
    return $out ?: $defaultFields;
}

function public_config(PDO $pdo): array {
    $config = decode_config($pdo);
    $config['form_fields'] = normalize_fields($config['form_fields'] ?? []);
    return [
        'enabled' => !empty($config['enabled']),
        'title' => (string)$config['title'],
        'description' => (string)$config['description'],
        'bkash_number' => (string)$config['bkash_number'],
        'bkash_label' => (string)$config['bkash_label'],
        'nagad_number' => (string)$config['nagad_number'],
        'nagad_label' => (string)$config['nagad_label'],
        'bank_name' => (string)$config['bank_name'],
        'bank_account_name' => (string)$config['bank_account_name'],
        'bank_account_number' => (string)$config['bank_account_number'],
        'bank_branch' => (string)$config['bank_branch'],
        'instruction' => (string)$config['instruction'],
        'form_fields' => $config['form_fields'],
    ];
}

$action = $_GET['action'] ?? 'public';

try {
    $pdo = db();

    if ($action === 'public' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        send_json(['success'=>true,'config'=>public_config($pdo)]);
    }

    if ($action === 'submit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = read_json_payload();
        $config = decode_config($pdo);
        $fields = normalize_fields($config['form_fields'] ?? []);
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];
        $clean = [];
        foreach ($fields as $field) {
            if (empty($field['enabled'])) continue;
            $value = trim((string)($data[$field['id']] ?? ''));
            if (!empty($field['required']) && $value === '') {
                send_json(['success'=>false,'message'=>$field['label'].' পূরণ করুন।'],422);
            }
            if ($field['type'] === 'number' && $value !== '' && (!is_numeric($value) || (float)$value <= 0)) {
                send_json(['success'=>false,'message'=>$field['label'].' সঠিকভাবে দিন।'],422);
            }
            if ($field['type'] === 'email' && $value !== '' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                send_json(['success'=>false,'message'=>'সঠিক email দিন।'],422);
            }
            if ($field['id'] === 'payment_method' && $value !== '') {
                $allowed = $field['options'] ?? [];
                if ($allowed && !in_array($value, $allowed, true)) send_json(['success'=>false,'message'=>'পেমেন্টের মাধ্যম সঠিক নয়।'],422);
            }
            $clean[$field['id']] = $value;
        }
        $amount = null;
        foreach (['amount','donation_amount'] as $key) {
            if (isset($clean[$key]) && $clean[$key] !== '') { $amount = (float)$clean[$key]; break; }
        }
        $method = (string)($clean['payment_method'] ?? '');
        $name = (string)($clean['donor_name'] ?? $clean['name'] ?? '');
        $phone = (string)($clean['phone'] ?? $clean['mobile'] ?? '');
        $stmt = $pdo->prepare('INSERT INTO donation_submissions (donor_name, phone, amount, payment_method, transaction_id, form_data, status) VALUES (?,?,?,?,?,?,?)');
        $stmt->execute([$name ?: null, $phone ?: null, $amount, $method ?: null, (string)($clean['transaction_id'] ?? ''), json_encode($clean, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES), 'pending']);
        $donationId=(int)$pdo->lastInsertId(); if(get_site_setting('notify_donation','1')==='1') create_notification($pdo,'donation','নতুন অনুদানের তথ্য',($name?:'একজন দাতা').' অনুদানের তথ্য জমা দিয়েছেন।','donation',$donationId);
        send_json(['success'=>true,'message'=>'আপনার অনুদানের তথ্য সফলভাবে জমা হয়েছে। ধন্যবাদ।'],201);
    }

    if ($action === 'admin-config' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        require_super_admin();
        send_json(['success'=>true,'config'=>public_config($pdo)]);
    }

    if ($action === 'save-config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_super_admin();
        $payload = read_json_payload();
        $config = [
            'enabled' => !empty($payload['enabled']),
            'title' => trim((string)($payload['title'] ?? '')),
            'description' => trim((string)($payload['description'] ?? '')),
            'bkash_number' => trim((string)($payload['bkash_number'] ?? '')),
            'bkash_label' => trim((string)($payload['bkash_label'] ?? 'বিকাশ')),
            'nagad_number' => trim((string)($payload['nagad_number'] ?? '')),
            'nagad_label' => trim((string)($payload['nagad_label'] ?? 'নগদ')),
            'bank_name' => trim((string)($payload['bank_name'] ?? '')),
            'bank_account_name' => trim((string)($payload['bank_account_name'] ?? '')),
            'bank_account_number' => trim((string)($payload['bank_account_number'] ?? '')),
            'bank_branch' => trim((string)($payload['bank_branch'] ?? '')),
            'instruction' => trim((string)($payload['instruction'] ?? '')),
            'form_fields' => normalize_fields($payload['form_fields'] ?? []),
        ];
        $stmt = $pdo->prepare('INSERT INTO site_settings (setting_key,setting_value) VALUES ("donation_config",?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)');
        $stmt->execute([json_encode($config, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)]);
        log_admin_activity($pdo,'Donation','save-config','Donation configuration আপডেট করা হয়েছে।');
        send_json(['success'=>true,'message'=>'Donation settings সফলভাবে সংরক্ষণ হয়েছে।','config'=>public_config($pdo)]);
    }

    require_admin_session();

    if ($action === 'submissions' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $rows = $pdo->query('SELECT * FROM donation_submissions ORDER BY created_at DESC, id DESC')->fetchAll();
        foreach ($rows as &$row) {
            $row['id']=(int)$row['id'];
            $row['amount']=$row['amount']!==null?(float)$row['amount']:null;
            $row['form_data']=json_decode($row['form_data'] ?? '{}', true) ?: [];
        }
        send_json(['success'=>true,'submissions'=>$rows]);
    }

    if ($action === 'submission-status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $p=read_json_payload(); $id=(int)($p['id']??0); $status=(string)($p['status']??'');
        if (!in_array($status,['pending','confirmed','cancelled'],true)) send_json(['success'=>false,'message'=>'Invalid status.'],422);
        $q=$pdo->prepare('UPDATE donation_submissions SET status=? WHERE id=?');$q->execute([$status,$id]);
        log_admin_activity($pdo,'Donation','status','Donation status '.$status.' করা হয়েছে।',$id);
        send_json(['success'=>true,'message'=>'Donation status আপডেট হয়েছে।']);
    }

    if ($action === 'delete-submission' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $p=read_json_payload(); $id=(int)($p['id']??0);
        $q=$pdo->prepare('DELETE FROM donation_submissions WHERE id=?');$q->execute([$id]);
        log_admin_activity($pdo,'Donation','delete','Donation record মুছে ফেলা হয়েছে।',$id);
        send_json(['success'=>true,'message'=>'Donation record মুছে ফেলা হয়েছে।']);
    }

    send_json(['success'=>false,'message'=>'Invalid donation request.'],405);
} catch (Throwable $e) {
    send_json(['success'=>false,'message'=>'Donation operation সম্পন্ন করা যায়নি।'],503);
}
