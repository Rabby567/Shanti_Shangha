import { useEffect, useState } from "react";
import { apiJson, postJson } from "../adminApi";

type Field = {id:string;label:string;type:string;required:boolean;enabled:boolean;placeholder?:string;options?:string[]};
type Config = {enabled:boolean;title:string;description:string;bkash_number:string;bkash_label:string;nagad_number:string;nagad_label:string;bank_name:string;bank_account_name:string;bank_account_number:string;bank_branch:string;instruction:string;form_fields:Field[]};
type Submission = {id:number;donor_name:string|null;phone:string|null;amount:number|null;payment_method:string|null;transaction_id:string|null;form_data:Record<string,string>;status:string;created_at:string};
const defaultFields:Field[]=[
 {id:"donor_name",label:"দাতার নাম",type:"text",required:true,enabled:true,placeholder:"আপনার নাম"},
 {id:"phone",label:"মোবাইল নম্বর",type:"tel",required:true,enabled:true,placeholder:"01XXXXXXXXX"},
 {id:"amount",label:"অনুদানের পরিমাণ (টাকা)",type:"number",required:true,enabled:true,placeholder:"যেমন 1000"},
 {id:"payment_method",label:"পেমেন্টের মাধ্যম",type:"select",required:true,enabled:true,options:["বিকাশ","নগদ","ব্যাংক"]},
 {id:"transaction_id",label:"Transaction ID / Reference",type:"text",required:false,enabled:true,placeholder:"প্রযোজ্য হলে লিখুন"},
 {id:"note",label:"অতিরিক্ত তথ্য",type:"textarea",required:false,enabled:true,placeholder:"কোনো বার্তা থাকলে লিখুন"},
];
const empty:Config={enabled:true,title:"মানবতার কাজে আপনার সহযোগিতা",description:"আপনার সামর্থ্য অনুযায়ী অনুদান দিয়ে আমাদের মানবিক কার্যক্রমে পাশে থাকুন।",bkash_number:"",bkash_label:"বিকাশ",nagad_number:"",nagad_label:"নগদ",bank_name:"",bank_account_name:"শান্তি সংঘ",bank_account_number:"",bank_branch:"",instruction:"অনুদান পাঠানোর পর নিচের ফর্মে আপনার পেমেন্টের তথ্য দিন।",form_fields:defaultFields};

export function DonationManagement(){
 const[c,setC]=useState<Config>(empty); const[sub,setSub]=useState<Submission[]>([]); const[loading,setLoading]=useState(true); const[saving,setSaving]=useState(false); const[msg,setMsg]=useState(""); const[err,setErr]=useState("");
 const load=async()=>{try{setLoading(true);const[a,b]=await Promise.all([apiJson<{config:Config}>("/api/donation.php?action=admin-config"),apiJson<{submissions:Submission[]}>("/api/donation.php?action=submissions")]);setC({...empty,...a.config});setSub(b.submissions);}catch(e){setErr(e instanceof Error?e.message:"Donation data লোড করা যায়নি।")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const update=(key:keyof Config,value:any)=>setC(x=>({...x,[key]:value}));
 const updateField=(i:number,key:keyof Field,value:any)=>setC(x=>({...x,form_fields:x.form_fields.map((f,n)=>n===i?{...f,[key]:value}:f)}));
 const addField=()=>setC(x=>({...x,form_fields:[...x.form_fields,{id:`field_${Date.now()}`,label:"নতুন তথ্য",type:"text",required:false,enabled:true,placeholder:""}]}));
 const removeField=(i:number)=>setC(x=>({...x,form_fields:x.form_fields.filter((_,n)=>n!==i)}));
 const save=async()=>{try{setSaving(true);setMsg("");setErr("");const d=await postJson<{message:string}>("/api/donation.php?action=save-config",c);setMsg(d.message);await load();}catch(e){setErr(e instanceof Error?e.message:"Save করা যায়নি।")}finally{setSaving(false)}};
 const status=async(id:number,value:string)=>{try{await postJson("/api/donation.php?action=submission-status",{id,status:value});await load()}catch(e){setErr(e instanceof Error?e.message:"Status update করা যায়নি.")}};
 const del=async(id:number)=>{if(!confirm("এই donation record মুছে ফেলবেন?"))return;try{await postJson("/api/donation.php?action=delete-submission",{id});await load()}catch(e){setErr(e instanceof Error?e.message:"Delete করা যায়নি.")}};
 if(loading)return <section className="admin-module"><div className="admin-form-card">Donation settings প্রস্তুত হচ্ছে...</div></section>;
 return <section className="admin-module donation-admin-module">
  <div className="admin-module-header"><div><span className="admin-kicker">DONATION MANAGEMENT</span><h1>অনুদান পরিচালনা</h1><p>পেমেন্ট তথ্য এবং donation form-এর প্রতিটি field এখান থেকে edit করুন।</p></div></div>
  {msg&&<div className="admin-success-notice">✓ {msg}</div>}{err&&<div className="admin-data-notice">{err}</div>}
  <div className="admin-form-card">
   <div className="admin-form-section-heading"><span className="admin-kicker">PAYMENT ACCOUNTS</span><h2>অনুদানের মাধ্যম</h2></div>
   <div className="admin-toggle-grid"><label className="admin-toggle-card"><span><strong>Donation section চালু</strong><small>Homepage-এ অনুদান section দেখাবে</small></span><input type="checkbox" checked={c.enabled} onChange={e=>update("enabled",e.target.checked)}/></label></div>
   <div className="admin-form-grid">
    <label><span>Section Title</span><input value={c.title} onChange={e=>update("title",e.target.value)}/></label>
    <label><span>Description</span><input value={c.description} onChange={e=>update("description",e.target.value)}/></label>
    <label><span>{c.bkash_label||"বিকাশ"} নম্বর</span><input value={c.bkash_number} onChange={e=>update("bkash_number",e.target.value)}/></label>
    <label><span>বিকাশ Label</span><input value={c.bkash_label} onChange={e=>update("bkash_label",e.target.value)}/></label>
    <label><span>{c.nagad_label||"নগদ"} নম্বর</span><input value={c.nagad_number} onChange={e=>update("nagad_number",e.target.value)}/></label>
    <label><span>নগদ Label</span><input value={c.nagad_label} onChange={e=>update("nagad_label",e.target.value)}/></label>
    <label><span>Bank Name</span><input value={c.bank_name} onChange={e=>update("bank_name",e.target.value)}/></label>
    <label><span>Account Name</span><input value={c.bank_account_name} onChange={e=>update("bank_account_name",e.target.value)}/></label>
    <label><span>Account Number</span><input value={c.bank_account_number} onChange={e=>update("bank_account_number",e.target.value)}/></label>
    <label><span>Branch</span><input value={c.bank_branch} onChange={e=>update("bank_branch",e.target.value)}/></label>
    <label className="full"><span>Donation Instruction</span><textarea rows={3} value={c.instruction} onChange={e=>update("instruction",e.target.value)}/></label>
   </div>
  </div>
  <div className="admin-form-card">
   <div className="admin-form-section-heading"><span className="admin-kicker">FORM BUILDER</span><h2>Donation Form-এর তথ্য</h2><p>নতুন field যোগ, label/type/required পরিবর্তন এবং field বন্ধ করতে পারবেন।</p></div>
   <div className="donation-admin-fields">{c.form_fields.map((f,i)=><div className="donation-admin-field" key={f.id}>
    <div className="donation-admin-field-head"><strong>Field {i+1}</strong><button type="button" className="admin-activity-actions danger" onClick={()=>removeField(i)}>মুছে ফেলুন</button></div>
    <div className="admin-form-grid">
     <label><span>Field ID</span><input value={f.id} onChange={e=>updateField(i,"id",e.target.value)}/></label>
     <label><span>Label</span><input value={f.label} onChange={e=>updateField(i,"label",e.target.value)}/></label>
     <label><span>Type</span><select value={f.type} onChange={e=>updateField(i,"type",e.target.value)}>{["text","tel","email","number","date","select","textarea"].map(t=><option key={t}>{t}</option>)}</select></label>
     <label><span>Placeholder</span><input value={f.placeholder||""} onChange={e=>updateField(i,"placeholder",e.target.value)}/></label>
     {f.type==="select"&&<label className="full"><span>Options — প্রতি লাইনে একটি</span><textarea rows={3} value={(f.options||[]).join("\n")} onChange={e=>updateField(i,"options",e.target.value.split("\n").map(x=>x.trim()).filter(Boolean))}/></label>}
     <label className="admin-checkbox-field"><input type="checkbox" checked={f.required} onChange={e=>updateField(i,"required",e.target.checked)}/><span>Required</span></label>
     <label className="admin-checkbox-field"><input type="checkbox" checked={f.enabled} onChange={e=>updateField(i,"enabled",e.target.checked)}/><span>Public form-এ দেখাবে</span></label>
    </div>
   </div>)}</div>
   <div className="admin-form-actions"><button className="admin-secondary-button" type="button" onClick={addField}>＋ Field যোগ করুন</button><button className="admin-primary-button" type="button" disabled={saving} onClick={save}>{saving?"সংরক্ষণ হচ্ছে...":"Donation Settings Save করুন"}</button></div>
  </div>
  <div className="admin-form-card">
   <div className="admin-form-section-heading"><span className="admin-kicker">DONATION RECORDS</span><h2>অনুদানের আবেদন</h2></div>
   {sub.length===0?<div className="admin-list-empty">এখনও কোনো donation জমা হয়নি।</div>:<div className="donation-submission-list">{sub.map(x=><article className="donation-submission" key={x.id}><div><strong>{x.donor_name||"নাম নেই"}</strong><small>{x.phone||"—"} • {x.amount!==null?`${x.amount} টাকা`:"পরিমাণ নেই"} • {x.payment_method||"—"}</small><small>{x.transaction_id||"Transaction ID নেই"} • {x.created_at}</small></div><div className="donation-submission-actions"><select value={x.status} onChange={e=>void status(x.id,e.target.value)}><option value="pending">অপেক্ষমাণ</option><option value="confirmed">নিশ্চিত</option><option value="cancelled">বাতিল</option></select><button type="button" onClick={()=>void del(x.id)}>Delete</button></div></article>)}</div>}
  </div>
 </section>;
}
