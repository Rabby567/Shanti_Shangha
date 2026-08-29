import { useEffect, useState } from "react";
import { apiJson } from "../adminApi";

type Log = { id:number; admin_name:string; admin_role:string; module:string; action:string; description:string; created_at:string };

export function ActivityLogManagement() {
  const [logs,setLogs]=useState<Log[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const load=async()=>{try{setLoading(true);const d=await apiJson<{activities:Log[]}>("/api/activities-log.php?action=list");setLogs(d.activities||[]);setError("");}catch(e){setError(e instanceof Error?e.message:"Activity load করা যায়নি।");}finally{setLoading(false);}};
  useEffect(()=>{load();const t=window.setInterval(load,15000);return()=>window.clearInterval(t);},[]);
  return <section className="admin-module">
    <div className="admin-module-header"><div><span className="admin-kicker">AUDIT TRAIL</span><h1>Activity</h1><p>কোন admin কখন কী পরিবর্তন বা action করেছে তার হিসাব এখানে দেখা যাবে।</p></div><button className="admin-secondary-button" type="button" onClick={load}>↻ Refresh</button></div>
    {error&&<div className="admin-login-error">{error}</div>}
    <div className="admin-form-card activity-log-card">
      {loading?<div className="admin-settings-loading">Activity load হচ্ছে...</div>:logs.length===0?<div className="notification-empty">এখনও কোনো activity log নেই।</div>:
      <div className="activity-log-list">{logs.map(log=><article key={log.id} className="activity-log-item"><span className="activity-log-avatar">{(log.admin_name||"A").slice(0,1)}</span><div><div className="activity-log-title"><strong>{log.admin_name}</strong><span>{log.admin_role==='super_admin'?'Super Admin':'Admin'}</span><b>{log.module}</b></div><p>{log.description}</p><small>{formatDate(log.created_at)}</small></div></article>)}</div>}
    </div>
  </section>;
}
function formatDate(value:string){try{return new Intl.DateTimeFormat("bn-BD",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value.replace(" ","T")));}catch{return value;}}
