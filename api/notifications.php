<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
allow_cors();
$adminId = require_admin_session();
$action = $_GET['action'] ?? 'list';
try {
    $pdo = db();
    if ($action === 'list' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare(
            'SELECT n.id,n.type,n.title,n.message,n.entity_type,n.entity_id,n.created_at,
                    CASE WHEN nr.notification_id IS NULL THEN 0 ELSE 1 END AS is_read
             FROM notifications n
             LEFT JOIN notification_reads nr ON nr.notification_id=n.id AND nr.admin_id=:admin_id
             ORDER BY n.created_at DESC,n.id DESC LIMIT 100'
        );
        $stmt->execute(['admin_id'=>$adminId]);
        $rows=$stmt->fetchAll();
        $unread=0;
        foreach($rows as &$row){$row['id']=(int)$row['id'];$row['entity_id']=$row['entity_id']!==null?(int)$row['entity_id']:null;$row['is_read']=(bool)$row['is_read'];if(!$row['is_read'])$unread++;}
        unset($row);
        send_json(['success'=>true,'notifications'=>$rows,'unread'=>$unread]);
    }
    if ($action === 'read' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $p=json_decode(file_get_contents('php://input'),true); if(!is_array($p))$p=[];
        if(!empty($p['all'])){
            $pdo->prepare('INSERT IGNORE INTO notification_reads(notification_id,admin_id) SELECT id,:admin_id FROM notifications')->execute(['admin_id'=>$adminId]);
        } else {
            $id=(int)($p['id']??0); if($id<1)send_json(['success'=>false,'message'=>'Notification id প্রয়োজন।'],422);
            $pdo->prepare('INSERT IGNORE INTO notification_reads(notification_id,admin_id) VALUES(:id,:admin_id)')->execute(['id'=>$id,'admin_id'=>$adminId]);
        }
        send_json(['success'=>true,'message'=>'Notification read হয়েছে।']);
    }
    send_json(['success'=>false,'message'=>'Invalid notification request.'],405);
} catch(Throwable $e){send_json(['success'=>false,'message'=>'Notification পরিচালনা করা যায়নি।'],503);}
