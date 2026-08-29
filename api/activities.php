<?php
/**
 * Activities API.
 *
 * Public:
 *   GET /api/activities.php?action=list
 *   GET /api/activities.php?action=one&id=123
 *
 * Admin:
 *   GET    /api/activities.php?action=admin-list
 *   POST   /api/activities.php?action=create
 *   POST   /api/activities.php?action=update
 *   POST   /api/activities.php?action=delete
 *
 * Activity images are stored as paths in activity_images.
 * Actual files will be handled by the hosting upload system later.
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

function require_admin(): void
{
    if (empty($_SESSION['admin_id'])) {
        send_json(['success' => false, 'message' => 'Authentication required.'], 401);
    }
}

function make_slug(string $title): string
{
    $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $title), '-'));
    return $slug !== '' ? $slug : 'activity';
}

function unique_slug(PDO $pdo, string $title, ?int $ignoreId = null): string
{
    $base = make_slug($title);
    $slug = $base;
    $counter = 2;

    while (true) {
        $sql = 'SELECT id FROM activities WHERE slug = :slug';
        $params = ['slug' => $slug];

        if ($ignoreId !== null) {
            $sql .= ' AND id != :id';
            $params['id'] = $ignoreId;
        }

        $statement = $pdo->prepare($sql . ' LIMIT 1');
        $statement->execute($params);

        if (!$statement->fetch()) {
            return $slug;
        }

        $slug = $base . '-' . $counter++;
    }
}

function normalize_activity(PDO $pdo, array $row): array
{
    $statement = $pdo->prepare(
        'SELECT id, file_path, caption, sort_order
         FROM activity_images
         WHERE activity_id = :activity_id
         ORDER BY sort_order ASC, id ASC'
    );
    $statement->execute(['activity_id' => $row['id']]);

    $photos = [];
    foreach ($statement->fetchAll() as $photo) {
        $photos[] = [
            'id' => (int) $photo['id'],
            'file_path' => (string) $photo['file_path'],
            'caption' => (string) ($photo['caption'] ?? ''),
            'sort_order' => (int) $photo['sort_order'],
        ];
    }

    $videoStatement = $pdo->prepare(
        'SELECT id, title, youtube_url, sort_order
         FROM activity_videos
         WHERE activity_id = :activity_id
         ORDER BY sort_order ASC, id ASC'
    );
    $videoStatement->execute(['activity_id' => $row['id']]);
    $videos = [];
    foreach ($videoStatement->fetchAll() as $video) {
        $videos[] = [
            'id' => (int) $video['id'],
            'title' => (string) ($video['title'] ?? ''),
            'youtube_url' => (string) $video['youtube_url'],
            'sort_order' => (int) $video['sort_order'],
        ];
    }

    return [
        'id' => (int) $row['id'],
        'title' => (string) $row['title'],
        'slug' => (string) $row['slug'],
        'short_description' => (string) ($row['short_description'] ?? ''),
        'description' => (string) ($row['description'] ?? ''),
        'event_date' => $row['event_date'],
        'location' => (string) ($row['location'] ?? ''),
        'cover_image' => (string) ($row['cover_image'] ?? ''),
        'is_published' => (bool) $row['is_published'],
        'sort_order' => (int) $row['sort_order'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'photos' => $photos,
        'videos' => $videos,
    ];
}

function read_payload(): array
{
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload)) {
        send_json(['success' => false, 'message' => 'Invalid JSON request.'], 422);
    }

    return $payload;
}

function upload_activity_file(): string
{
    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        send_json(['success' => false, 'message' => 'একটি image file নির্বাচন করুন।'], 422);
    }

    $max = max(1, min(50, (int) get_site_setting('upload_max_size_mb', '8')));
    if ((int) $_FILES['file']['size'] > $max * 1024 * 1024) {
        send_json(['success' => false, 'message' => 'ছবির সর্বোচ্চ আকার ' . $max . ' MB।'], 422);
    }

    $tmp = $_FILES['file']['tmp_name'];
    if (!is_uploaded_file($tmp)) {
        send_json(['success' => false, 'message' => 'অবৈধ image upload।'], 422);
    }

    $formatList = array_values(array_filter(array_map('strtolower', array_map('trim', explode(',', get_site_setting('upload_allowed_formats', 'jpg,png,webp,gif'))))));
    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
    $allowed = array_filter($allowed, fn($ext) => in_array($ext, $formatList, true));
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
    if (!isset($allowed[$mime])) {
        send_json(['success' => false, 'message' => 'এই image format বর্তমানে অনুমোদিত নয়।'], 422);
    }

    $directory = dirname(__DIR__) . '/uploads/activities';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        send_json(['success' => false, 'message' => 'Activities upload folder তৈরি করা যায়নি।'], 503);
    }

    $filename = bin2hex(random_bytes(16)) . '-' . time() . '.' . $allowed[$mime];
    $destination = $directory . '/' . $filename;
    if (!move_uploaded_file($tmp, $destination)) {
        send_json(['success' => false, 'message' => 'ছবি upload করা যায়নি।'], 503);
    }

    return '/uploads/activities/' . $filename;
}

function save_activity_images(PDO $pdo, int $activityId, array $photos): void
{
    $pdo->prepare('DELETE FROM activity_images WHERE activity_id = :activity_id')
        ->execute(['activity_id' => $activityId]);

    $statement = $pdo->prepare(
        'INSERT INTO activity_images (activity_id, file_path, caption, sort_order)
         VALUES (:activity_id, :file_path, :caption, :sort_order)'
    );

    foreach ($photos as $index => $photo) {
        if (is_string($photo)) {
            $path = trim($photo);
            $caption = '';
        } elseif (is_array($photo)) {
            $path = trim((string) ($photo['file_path'] ?? ''));
            $caption = trim((string) ($photo['caption'] ?? ''));
        } else {
            continue;
        }

        if ($path === '') {
            continue;
        }

        $statement->execute([
            'activity_id' => $activityId,
            'file_path' => $path,
            'caption' => $caption,
            'sort_order' => $index,
        ]);
    }
}


function youtube_id(string $url): ?string
{
    $url = trim($url);
    if ($url === '') return null;
    $parts = parse_url($url);
    if (!$parts || empty($parts['host'])) return null;
    $host = strtolower((string)$parts['host']);
    $path = trim((string)($parts['path'] ?? ''), '/');

    if (str_contains($host, 'youtu.be')) {
        $id = explode('/', $path)[0] ?? '';
    } elseif (str_contains($host, 'youtube.com') || str_contains($host, 'youtube-nocookie.com')) {
        parse_str((string)($parts['query'] ?? ''), $query);
        if (!empty($query['v'])) {
            $id = (string)$query['v'];
        } elseif (preg_match('#^(?:embed|shorts|live)/([^/]+)#', $path, $m)) {
            $id = $m[1];
        } else {
            $id = '';
        }
    } else {
        return null;
    }

    return preg_match('/^[A-Za-z0-9_-]{6,20}$/', $id) ? $id : null;
}

function save_activity_videos(PDO $pdo, int $activityId, array $videos): void
{
    $pdo->prepare('DELETE FROM activity_videos WHERE activity_id = :activity_id')
        ->execute(['activity_id' => $activityId]);

    $statement = $pdo->prepare(
        'INSERT INTO activity_videos (activity_id, title, youtube_url, sort_order)
         VALUES (:activity_id, :title, :youtube_url, :sort_order)'
    );

    foreach ($videos as $index => $video) {
        if (is_string($video)) {
            $url = trim($video);
            $title = '';
        } elseif (is_array($video)) {
            $url = trim((string)($video['youtube_url'] ?? $video['url'] ?? ''));
            $title = trim((string)($video['title'] ?? ''));
        } else {
            continue;
        }

        if ($url === '') continue;
        if (!youtube_id($url)) {
            send_json(['success'=>false,'message'=>'শুধু বৈধ YouTube video link ব্যবহার করুন।'],422);
        }
        $statement->execute([
            'activity_id' => $activityId,
            'title' => $title,
            'youtube_url' => $url,
            'sort_order' => (int)$index,
        ]);
    }
}

$action = $_GET['action'] ?? 'list';

try {
    $pdo = db();

    // Admin-only image upload used by the activity ImagePicker.
    if ($action === 'upload-image' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_admin();
        send_json([
            'success' => true,
            'message' => 'ছবি সফলভাবে upload হয়েছে।',
            'path' => upload_activity_file(),
        ]);
    }

    if ($action === 'list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $statement = $pdo->query(
            'SELECT * FROM activities
             WHERE is_published = 1
             ORDER BY sort_order ASC, event_date DESC, id DESC'
        );

        $activities = array_map(
            fn(array $row): array => normalize_activity($pdo, $row),
            $statement->fetchAll()
        );

        send_json(['success' => true, 'activities' => $activities]);
    }

    if ($action === 'one' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        $slug = trim((string) ($_GET['slug'] ?? ''));

        if ($id > 0) {
            $statement = $pdo->prepare('SELECT * FROM activities WHERE id = :id LIMIT 1');
            $statement->execute(['id' => $id]);
        } elseif ($slug !== '') {
            $statement = $pdo->prepare('SELECT * FROM activities WHERE slug = :slug LIMIT 1');
            $statement->execute(['slug' => $slug]);
        } else {
            send_json(['success' => false, 'message' => 'Activity identifier is required.'], 422);
        }

        $row = $statement->fetch();

        if (!$row || (!(bool) $row['is_published'] && empty($_SESSION['admin_id']))) {
            send_json(['success' => false, 'message' => 'Activity not found.'], 404);
        }

        send_json(['success' => true, 'activity' => normalize_activity($pdo, $row)]);
    }

    require_admin();

    if ($action === 'admin-list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $statement = $pdo->query(
            'SELECT * FROM activities
             ORDER BY sort_order ASC, event_date DESC, id DESC'
        );

        $activities = array_map(
            fn(array $row): array => normalize_activity($pdo, $row),
            $statement->fetchAll()
        );

        send_json(['success' => true, 'activities' => $activities]);
    }

    if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = read_payload();

        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            send_json(['success' => false, 'message' => 'কার্যক্রমের নাম দিন।'], 422);
        }

        $slug = unique_slug($pdo, $title);

        $statement = $pdo->prepare(
            'INSERT INTO activities
                (title, slug, short_description, description, event_date, location,
                 cover_image, is_published, sort_order)
             VALUES
                (:title, :slug, :short_description, :description, :event_date, :location,
                 :cover_image, :is_published, :sort_order)'
        );

        $statement->execute([
            'title' => $title,
            'slug' => $slug,
            'short_description' => trim((string) ($payload['short_description'] ?? '')),
            'description' => trim((string) ($payload['description'] ?? '')),
            'event_date' => (($value = trim((string) ($payload['event_date'] ?? ''))) !== '') ? $value : null,
            'location' => trim((string) ($payload['location'] ?? '')),
            'cover_image' => trim((string) ($payload['cover_image'] ?? '')),
            'is_published' => !empty($payload['is_published']) ? 1 : 0,
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
        ]);

        $activityId = (int) $pdo->lastInsertId();
        save_activity_images($pdo, $activityId, (array) ($payload['photos'] ?? []));
        save_activity_videos($pdo, $activityId, (array) ($payload['videos'] ?? []));

        $created = $pdo->prepare('SELECT * FROM activities WHERE id = :id');
        $created->execute(['id' => $activityId]);

        send_json([
            'success' => true,
            'message' => 'কার্যক্রম সফলভাবে যোগ হয়েছে।',
            'activity' => normalize_activity($pdo, $created->fetch()),
        ], 201);
    }

    if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = read_payload();
        $id = (int) ($payload['id'] ?? 0);

        if ($id < 1) {
            send_json(['success' => false, 'message' => 'কার্যক্রমের ID প্রয়োজন।'], 422);
        }

        $title = trim((string) ($payload['title'] ?? ''));
        if ($title === '') {
            send_json(['success' => false, 'message' => 'কার্যক্রমের নাম দিন।'], 422);
        }

        $exists = $pdo->prepare('SELECT id FROM activities WHERE id = :id LIMIT 1');
        $exists->execute(['id' => $id]);

        if (!$exists->fetch()) {
            send_json(['success' => false, 'message' => 'কার্যক্রমটি পাওয়া যায়নি।'], 404);
        }

        $slug = unique_slug($pdo, $title, $id);

        $statement = $pdo->prepare(
            'UPDATE activities SET
                title = :title,
                slug = :slug,
                short_description = :short_description,
                description = :description,
                event_date = :event_date,
                location = :location,
                cover_image = :cover_image,
                is_published = :is_published,
                sort_order = :sort_order
             WHERE id = :id'
        );

        $statement->execute([
            'id' => $id,
            'title' => $title,
            'slug' => $slug,
            'short_description' => trim((string) ($payload['short_description'] ?? '')),
            'description' => trim((string) ($payload['description'] ?? '')),
            'event_date' => (($value = trim((string) ($payload['event_date'] ?? ''))) !== '') ? $value : null,
            'location' => trim((string) ($payload['location'] ?? '')),
            'cover_image' => trim((string) ($payload['cover_image'] ?? '')),
            'is_published' => !empty($payload['is_published']) ? 1 : 0,
            'sort_order' => (int) ($payload['sort_order'] ?? 0),
        ]);

        save_activity_images($pdo, $id, (array) ($payload['photos'] ?? []));
        save_activity_videos($pdo, $id, (array) ($payload['videos'] ?? []));

        $updated = $pdo->prepare('SELECT * FROM activities WHERE id = :id');
        $updated->execute(['id' => $id]);

        send_json([
            'success' => true,
            'message' => 'কার্যক্রম সফলভাবে আপডেট হয়েছে।',
            'activity' => normalize_activity($pdo, $updated->fetch()),
        ]);
    }

    if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $payload = read_payload();
        $id = (int) ($payload['id'] ?? 0);

        if ($id < 1) {
            send_json(['success' => false, 'message' => 'কার্যক্রমের ID প্রয়োজন।'], 422);
        }

        $statement = $pdo->prepare('DELETE FROM activities WHERE id = :id');
        $statement->execute(['id' => $id]);

        if ($statement->rowCount() === 0) {
            send_json(['success' => false, 'message' => 'কার্যক্রমটি পাওয়া যায়নি।'], 404);
        }

        send_json([
            'success' => true,
            'message' => 'কার্যক্রম মুছে ফেলা হয়েছে।',
        ]);
    }

    send_json(['success' => false, 'message' => 'Invalid activities request.'], 405);
} catch (Throwable $error) {
    send_json([
        'success' => false,
        'message' => 'কার্যক্রমের তথ্য সংরক্ষণ করা যায়নি।',
    ], 503);
}
