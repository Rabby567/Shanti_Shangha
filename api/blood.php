<?php
require_once __DIR__.'/helpers.php'; require_once __DIR__.'/db.php'; allow_cors();
$config=require __DIR__.'/config.php'; session_name($config['app']['session_name']??'shanti_sangha_admin'); session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off'),'httponly'=>true,'samesite'=>'Lax']); session_start();
function blood_payload():array{$d=json_decode(file_get_contents('php://input'),true);return is_array($d)?$d:[];} function blood_admin():void{if(empty($_SESSION['admin_id']))send_json(['success'=>false,'message'=>'Authentication required.'],401);}
function ensure_blood_assignment_schema(PDO $pdo):void{
  $col=$pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='blood_donors' AND COLUMN_NAME='donation_count'")->fetchColumn();
  if(!(int)$col) $pdo->exec("ALTER TABLE blood_donors ADD COLUMN donation_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER last_donation_date");
  $pdo->exec("CREATE TABLE IF NOT EXISTS blood_request_donors (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, request_id BIGINT UNSIGNED NOT NULL, donor_id BIGINT UNSIGNED NOT NULL, assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, confirmed_at DATETIME NULL, donated_at DATETIME NULL, UNIQUE KEY uq_request_donor(request_id,donor_id), CONSTRAINT fk_brd_request FOREIGN KEY(request_id) REFERENCES blood_requests(id) ON DELETE CASCADE, CONSTRAINT fk_brd_donor FOREIGN KEY(donor_id) REFERENCES blood_donors(id) ON DELETE CASCADE, INDEX idx_brd_request(request_id), INDEX idx_brd_donor(donor_id)) ENGINE=InnoDB");
}
$action=$_GET['action']??'';try{$pdo=db(); ensure_blood_assignment_schema($pdo);
 if($action==='request'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();foreach(['patient_name','blood_group','contact_phone'] as $k){if(trim((string)($p[$k]??''))==='')send_json(['success'=>false,'message'=>'প্রয়োজনীয় তথ্য পূরণ করুন।'],422);}$date=trim((string)($p['required_date']??''));$s=$pdo->prepare('INSERT INTO blood_requests(patient_name,blood_group,contact_phone,hospital,location,required_date,units_needed,details) VALUES(?,?,?,?,?,?,?,?)');$s->execute([trim((string)$p['patient_name']),trim((string)$p['blood_group']),trim((string)$p['contact_phone']),trim((string)($p['hospital']??'')),trim((string)($p['location']??'')),$date!==''?$date:null,max(1,(int)($p['units_needed']??1)),trim((string)($p['details']??''))]);$requestId=(int)$pdo->lastInsertId();if(get_site_setting('notify_blood_request','1')==='1')create_notification($pdo,'blood','নতুন রক্তের আবেদন',trim((string)$p['patient_name']).' এর জন্য '.trim((string)$p['blood_group']).' রক্তের আবেদন এসেছে।','blood_request',$requestId);send_json(['success'=>true,'message'=>'রক্তের আবেদন সফলভাবে পাঠানো হয়েছে।'],201);}
 if($action==='donor'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();foreach(['name','blood_group','phone','area'] as $k){if(trim((string)($p[$k]??''))==='')send_json(['success'=>false,'message'=>'প্রয়োজনীয় তথ্য পূরণ করুন।'],422);}$date=trim((string)($p['last_donation_date']??''));$s=$pdo->prepare('INSERT INTO blood_donors(name,blood_group,phone,area,last_donation_date,availability,status) VALUES(?,?,?,?,?,?,?)');$s->execute([trim((string)$p['name']),trim((string)$p['blood_group']),trim((string)$p['phone']),trim((string)$p['area']),$date!==''?$date:null,'available','pending']);$donorId=(int)$pdo->lastInsertId();if(get_site_setting('notify_member_application','1')==='1')create_notification($pdo,'blood','নতুন রক্তদাতা নিবন্ধন',trim((string)$p['name']).' নতুন রক্তদাতা হিসেবে নিবন্ধন করেছেন।','blood_donor',$donorId);send_json(['success'=>true,'message'=>'রক্তদাতা নিবন্ধন সফলভাবে পাঠানো হয়েছে।'],201);}
 blood_admin();
 if($action==='requests'&&$_SERVER['REQUEST_METHOD']==='GET'){
  $requests=$pdo->query('SELECT * FROM blood_requests ORDER BY created_at DESC,id DESC')->fetchAll();
  $selected=$pdo->query('SELECT brd.request_id, d.id,d.name,d.blood_group,d.phone,d.area,d.last_donation_date,d.donation_count FROM blood_request_donors brd JOIN blood_donors d ON d.id=brd.donor_id WHERE brd.donated_at IS NULL ORDER BY brd.assigned_at ASC')->fetchAll();
  $by=[]; foreach($selected as $d){$by[(int)$d['request_id']][]=$d;}
  foreach($requests as &$r){$r['selected_donors']=$by[(int)$r['id']]??[];$r['selected_count']=count($r['selected_donors']);} unset($r);
  send_json(['success'=>true,'requests'=>$requests]);
}
 if($action==='donors'&&$_SERVER['REQUEST_METHOD']==='GET'){
  $rows=$pdo->query('SELECT * FROM blood_donors ORDER BY created_at DESC,id DESC')->fetchAll();
  $today=new DateTimeImmutable('today');
  $sync=$pdo->prepare('UPDATE blood_donors SET availability=? WHERE id=?');
  foreach($rows as &$row){
    $last=trim((string)($row['last_donation_date']??''));
    $available=true;
    $eligible_from=null;
    if($last!==''){
      try{
        $eligible=(new DateTimeImmutable($last))->modify('+4 months');
        $eligible_from=$eligible->format('Y-m-d');
        $available=$today >= $eligible;
      }catch(Throwable $e){ $available=false; }
    }
    $derived=$available?'available':'unavailable';
    if(($row['availability']??'')!==$derived) $sync->execute([$derived,(int)$row['id']]);
    $row['availability']=$derived;
    $row['eligible_from']=$eligible_from;
  }
  unset($row);
  $availableCount=0;
  foreach($rows as $row){ if(($row['status']??'')==='approved' && ($row['availability']??'')==='available') $availableCount++; }
  send_json(['success'=>true,'donors'=>$rows,'available_count'=>$availableCount]);
}
 if($action==='request-donor-options'&&$_SERVER['REQUEST_METHOD']==='GET'){
  $requestId=(int)($_GET['request_id']??0); $req=$pdo->prepare('SELECT id,blood_group,units_needed,status FROM blood_requests WHERE id=?');$req->execute([$requestId]);$request=$req->fetch();
  if(!$request) send_json(['success'=>false,'message'=>'আবেদনটি পাওয়া যায়নি।'],404);
  $q=$pdo->prepare("SELECT d.id,d.name,d.blood_group,d.phone,d.area,d.last_donation_date,d.donation_count FROM blood_donors d WHERE d.blood_group=? AND d.status='approved' AND d.availability='available' AND NOT EXISTS (SELECT 1 FROM blood_request_donors x JOIN blood_requests r ON r.id=x.request_id WHERE x.donor_id=d.id AND x.request_id<>? AND x.donated_at IS NULL AND r.status IN ('pending','approved')) ORDER BY d.name ASC");$q->execute([$request['blood_group'],$requestId]);
  $s=$pdo->prepare('SELECT d.id,d.name,d.blood_group,d.phone,d.area,d.last_donation_date,d.donation_count,brd.assigned_at FROM blood_request_donors brd JOIN blood_donors d ON d.id=brd.donor_id WHERE brd.request_id=? AND brd.donated_at IS NULL ORDER BY brd.assigned_at ASC');$s->execute([$requestId]);
  send_json(['success'=>true,'request'=>$request,'available_donors'=>$q->fetchAll(),'selected_donors'=>$s->fetchAll()]);
}
if($action==='assign-donor'&&$_SERVER['REQUEST_METHOD']==='POST'){
  $p=blood_payload();$requestId=(int)($p['request_id']??0);$donorId=(int)($p['donor_id']??0);
  $rq=$pdo->prepare('SELECT * FROM blood_requests WHERE id=?');$rq->execute([$requestId]);$req=$rq->fetch(); if(!$req) send_json(['success'=>false,'message'=>'আবেদনটি পাওয়া যায়নি।'],404);
  if($req['status']!=='pending') send_json(['success'=>false,'message'=>'শুধু অপেক্ষমাণ আবেদনেই donor নির্বাচন করা যাবে।'],422);
  $cq=$pdo->prepare('SELECT COUNT(*) FROM blood_request_donors WHERE request_id=? AND donated_at IS NULL');$cq->execute([$requestId]);$count=(int)$cq->fetchColumn(); if($count >= (int)$req['units_needed']) send_json(['success'=>false,'message'=>'প্রয়োজনীয় সব donor ইতিমধ্যে নির্বাচন করা হয়েছে।'],422);
  $dq=$pdo->prepare("SELECT * FROM blood_donors WHERE id=? AND blood_group=? AND status='approved' AND availability='available'");$dq->execute([$donorId,$req['blood_group']]);$donor=$dq->fetch(); if(!$donor) send_json(['success'=>false,'message'=>'এই donor বর্তমানে উপলভ্য নেই বা blood group মেলেনি।'],422);
  $reserved=$pdo->prepare("SELECT COUNT(*) FROM blood_request_donors x JOIN blood_requests r ON r.id=x.request_id WHERE x.donor_id=? AND x.request_id<>? AND x.donated_at IS NULL AND r.status IN ('pending','approved')");$reserved->execute([$donorId,$requestId]); if((int)$reserved->fetchColumn()>0) send_json(['success'=>false,'message'=>'এই donor অন্য একটি চলমান আবেদনের জন্য নির্বাচিত আছেন।'],422);
  try{$q=$pdo->prepare('INSERT INTO blood_request_donors(request_id,donor_id,confirmed_at) VALUES(?,?,CURRENT_TIMESTAMP)');$q->execute([$requestId,$donorId]);log_admin_activity($pdo,'Blood','assign-donor','রক্তের আবেদনে একজন donor নির্বাচন করা হয়েছে।',$requestId);send_json(['success'=>true,'message'=>'রক্তদাতা নির্বাচিত হয়েছে।']);}catch(PDOException $e){send_json(['success'=>false,'message'=>'এই donor ইতিমধ্যে নির্বাচিত হয়েছে।'],409);}
}
if($action==='remove-assigned-donor'&&$_SERVER['REQUEST_METHOD']==='POST'){
  $p=blood_payload();$requestId=(int)($p['request_id']??0);$donorId=(int)($p['donor_id']??0);$q=$pdo->prepare('DELETE FROM blood_request_donors WHERE request_id=? AND donor_id=? AND donated_at IS NULL');$q->execute([$requestId,$donorId]);log_admin_activity($pdo,'Blood','assign-donor','রক্তের আবেদনে একজন donor নির্বাচন করা হয়েছে।',$requestId);send_json(['success'=>true,'message'=>'নির্বাচিত donor সরানো হয়েছে।']);
}
if($action==='fulfill-request'&&$_SERVER['REQUEST_METHOD']==='POST'){
  $p=blood_payload();$requestId=(int)($p['id']??0);$pdo->beginTransaction();$rq=$pdo->prepare('SELECT * FROM blood_requests WHERE id=? FOR UPDATE');$rq->execute([$requestId]);$req=$rq->fetch();
  if(!$req){$pdo->rollBack();send_json(['success'=>false,'message'=>'আবেদনটি পাওয়া যায়নি।'],404);}
  if($req['status']==='fulfilled'){$pdo->commit();send_json(['success'=>true,'message'=>'আবেদনটি ইতিমধ্যে সম্পন্ন।']);}
  $q=$pdo->prepare('SELECT donor_id FROM blood_request_donors WHERE request_id=? AND donated_at IS NULL FOR UPDATE');$q->execute([$requestId]);$donorIds=$q->fetchAll(PDO::FETCH_COLUMN);
  if(count($donorIds)!=(int)$req['units_needed']){$pdo->rollBack();send_json(['success'=>false,'message'=>"সম্পন্ন করার আগে ঠিক {$req['units_needed']} জন রক্তদাতা নির্বাচন করুন।"],422);}
  $today=(new DateTimeImmutable('today'))->format('Y-m-d');$up=$pdo->prepare('UPDATE blood_donors SET last_donation_date=?, donation_count=donation_count+1, availability="unavailable" WHERE id=?');$mark=$pdo->prepare('UPDATE blood_request_donors SET donated_at=CURRENT_TIMESTAMP WHERE request_id=? AND donor_id=?');
  foreach($donorIds as $did){$up->execute([$today,(int)$did]);$mark->execute([$requestId,(int)$did]);}
  $st=$pdo->prepare('UPDATE blood_requests SET status="fulfilled" WHERE id=?');$st->execute([$requestId]);$pdo->commit();log_admin_activity($pdo,'Blood','fulfill','রক্তের আবেদন সম্পন্ন হিসেবে সংরক্ষণ করা হয়েছে।',$requestId);send_json(['success'=>true,'message'=>'রক্তদান সম্পন্ন হিসেবে সংরক্ষণ করা হয়েছে।']);
}
if($action==='donor-count'&&$_SERVER['REQUEST_METHOD']==='POST'){
  $p=blood_payload();$id=(int)($p['id']??0);$count=max(0,(int)($p['donation_count']??0));$q=$pdo->prepare('UPDATE blood_donors SET donation_count=? WHERE id=?');$q->execute([$count,$id]);send_json(['success'=>true,'message'=>'রক্তদানের সংখ্যা আপডেট হয়েছে।']);
}
if($action==='request-status'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();$id=(int)($p['id']??0);$st=(string)($p['status']??'');if(!in_array($st,['pending','approved','fulfilled','cancelled'],true))send_json(['success'=>false,'message'=>'Invalid status.'],422);$q=$pdo->prepare('UPDATE blood_requests SET status=? WHERE id=?');$q->execute([$st,$id]);log_admin_activity($pdo,'Blood','request-status','রক্তের আবেদনের status '.$st.' করা হয়েছে।',$id);send_json(['success'=>true,'message'=>'রক্তের আবেদনের status আপডেট হয়েছে।']);}
 if($action==='donor-status'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();$id=(int)($p['id']??0);$st=(string)($p['status']??'');if(!in_array($st,['pending','approved','rejected'],true))send_json(['success'=>false,'message'=>'Invalid status.'],422);$q=$pdo->prepare('UPDATE blood_donors SET status=? WHERE id=?');$q->execute([$st,$id]);log_admin_activity($pdo,'Blood','donor-status','রক্তদাতার approval status '.$st.' করা হয়েছে।',$id);send_json(['success'=>true,'message'=>'রক্তদাতার approval status আপডেট হয়েছে।']);}
 if($action==='donor-availability'&&$_SERVER['REQUEST_METHOD']==='POST')send_json(['success'=>false,'message'=>'রক্তদাতার availability শেষ রক্তদানের তারিখ অনুযায়ী স্বয়ংক্রিয়ভাবে নির্ধারিত হয়।'],422);
 if($action==='delete-request'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();$q=$pdo->prepare('DELETE FROM blood_requests WHERE id=?');$id=(int)($p['id']??0);$q->execute([$id]);log_admin_activity($pdo,'Blood','delete-request','রক্তের আবেদন মুছে ফেলা হয়েছে।',$id);send_json(['success'=>true,'message'=>'রক্তের আবেদন মুছে ফেলা হয়েছে।']);}
 if($action==='delete-donor'&&$_SERVER['REQUEST_METHOD']==='POST'){$p=blood_payload();$q=$pdo->prepare('DELETE FROM blood_donors WHERE id=?');$id=(int)($p['id']??0);$q->execute([$id]);log_admin_activity($pdo,'Blood','delete-donor','রক্তদাতার রেকর্ড মুছে ফেলা হয়েছে।',$id);send_json(['success'=>true,'message'=>'রক্তদাতার রেকর্ড মুছে ফেলা হয়েছে।']);}
 send_json(['success'=>false,'message'=>'Invalid blood request.'],405);
}catch(Throwable $e){send_json(['success'=>false,'message'=>'রক্ত সেবা পরিচালনা করা যায়নি।'],503);}
