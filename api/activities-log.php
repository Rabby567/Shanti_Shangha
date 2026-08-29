<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
allow_cors();
$adminId = require_admin_session();
$action=$_GET['action']??'list';
try{
 $pdo=db();
 if($action==='list'&&$_SERVER['REQUEST_METHOD']==='GET'){
   $stmt=$pdo->prepare('SELECT l.id,l.module,l.action,l.description,l.entity_id,l.created_at,a.name AS admin_name,a.role AS admin_role FROM admin_activity_logs l INNER JOIN admins a ON a.id=l.admin_id ORDER BY l.created_at DESC,l.id DESC LIMIT 200');
   $stmt->execute(); $rows=$stmt->fetchAll(); foreach($rows as &$r){$r['id']=(int)$r['id'];$r['entity_id']=$r['entity_id']!==null?(int)$r['entity_id']:null;} unset($r);
   send_json(['success'=>true,'activities'=>$rows]);
 }
 send_json(['success'=>false,'message'=>'Invalid activity request.'],405);
}catch(Throwable $e){send_json(['success'=>false,'message'=>'Activity log পাওয়া যায়নি।'],503);}
