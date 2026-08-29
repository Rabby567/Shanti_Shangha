import { useEffect, useState } from "react";
import { apiJson } from "../adminApi";
import type { AdminNotification } from "./NotificationCenter";

export function NotificationsManagement(){
 const [items,setItems]=useState<AdminNotification[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const load=async()=>{try{setLoading(true);const d=await apiJson<{notifications:AdminNotification[]}>("/api/notifications.php?action=list");setItems(d.notifications||[]);setError("");}catch(e){setError(e instanceof Error?e.message:"Notification load করা যায়নি।");}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const read=async(id?:number)=>{try{await apiJson("/api/notifications.php?action=read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(id?{id}:{all:true})});await load();}catch(e){setError(e instanceof Error?e.message:"Notification update করা যায়নি।");}};
 return <section className="admin-module"><div className="admin-module-header"><div><span className="admin-kicker">INBOX</span><h1>Notifications</h1><p>রক্তের আবেদন, সদস্য আবেদন, অনুদান ও অন্যান্য গুরুত্বপূর্ণ alert এখানে দেখুন।</p></div><button className="admin-secondary-button" type="button" onClick={()=>read()}>সব পড়া</button></div>{error&&<div className="admin-login-error">{error}</div>}<div className="admin-form-card notification-page-card">{loading?<div className="admin-settings-loading">Notification load হচ্ছে...</div>:items.length===0?<div className="notification-empty">কোনো notification পাওয়া যায়নি।</div>:<div className="notification-list">{items.map(i=><button key={i.id} type="button" className={`notification-item ${i.is_read?'is-read':'is-unread'}`} onClick={()=>read(i.id)}><span className="notification-item-icon">{i.type==='blood'?'🩸':i.type==='member'?'👤':i.type==='donation'?'৳':'🔔'}</span><span><strong>{i.title}</strong><small>{i.message}</small><em>{i.created_at}</em></span></button>)}</div>}</div></section>;
}
