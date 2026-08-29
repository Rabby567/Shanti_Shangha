import { useEffect, useState, type FormEvent } from "react";
import { apiJson } from "../adminApi";

type DonationField = {
  id: string; label: string; type: "text"|"tel"|"email"|"number"|"date"|"select"|"textarea";
  required: boolean; enabled: boolean; placeholder?: string; options?: string[];
};
type DonationConfig = {
  enabled: boolean; title: string; description: string;
  bkash_number: string; bkash_label: string; nagad_number: string; nagad_label: string;
  bank_name: string; bank_account_name: string; bank_account_number: string; bank_branch: string;
  instruction: string; form_fields: DonationField[];
};

const fallback: DonationConfig = {
  enabled:true,title:"মানবতার কাজে আপনার সহযোগিতা",
  description:"আপনার সামর্থ্য অনুযায়ী অনুদান দিয়ে আমাদের মানবিক কার্যক্রমে পাশে থাকুন।",
  bkash_number:"",bkash_label:"বিকাশ",nagad_number:"",nagad_label:"নগদ",
  bank_name:"",bank_account_name:"শান্তি সংঘ",bank_account_number:"",bank_branch:"",
  instruction:"অনুদান পাঠানোর পর নিচের ফর্মে আপনার পেমেন্টের তথ্য দিন।",
  form_fields:[
    {id:"donor_name",label:"দাতার নাম",type:"text",required:true,enabled:true,placeholder:"আপনার নাম"},
    {id:"phone",label:"মোবাইল নম্বর",type:"tel",required:true,enabled:true,placeholder:"01XXXXXXXXX"},
    {id:"amount",label:"অনুদানের পরিমাণ (টাকা)",type:"number",required:true,enabled:true,placeholder:"যেমন 1000"},
    {id:"payment_method",label:"পেমেন্টের মাধ্যম",type:"select",required:true,enabled:true,options:["বিকাশ","নগদ","ব্যাংক"]},
    {id:"transaction_id",label:"Transaction ID / Reference",type:"text",required:false,enabled:true,placeholder:"প্রযোজ্য হলে লিখুন"},
    {id:"note",label:"অতিরিক্ত তথ্য",type:"textarea",required:false,enabled:true,placeholder:"কোনো বার্তা থাকলে লিখুন"},
  ]
};

export function DonationSection({ onSubmit }: { onSubmit:(message:string)=>void }) {
  const [config,setConfig]=useState<DonationConfig>(fallback);
  const [open,setOpen]=useState(false);
  const [method,setMethod]=useState("");
  const [values,setValues]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);

  useEffect(()=>{ fetch("/api/donation.php?action=public").then(r=>r.json()).then(d=>{if(d.success&&d.config)setConfig({...fallback,...d.config});}).catch(()=>{}); },[]);
  useEffect(()=>{ if(open) document.body.style.overflow="hidden"; else document.body.style.overflow=""; return()=>{document.body.style.overflow="";}; },[open]);

  if (!config.enabled) return null;
  const openForm=(selectedMethod="")=>{
    setMethod(selectedMethod);
    setValues(selectedMethod ? {payment_method:selectedMethod} : {});
    setOpen(true);
  };
  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    try{
      setBusy(true);
      const data=await apiJson<{message:string}>("/api/donation.php?action=submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:values})});
      setOpen(false); setValues({}); onSubmit(data.message);
    }catch(err){ onSubmit(err instanceof Error?err.message:"অনুদানের তথ্য পাঠানো যায়নি।"); }
    finally{setBusy(false);}
  };
  const renderField=(f:DonationField)=>{
    if(!f.enabled) return null;
    const common={id:f.id,name:f.id,value:values[f.id]||"",required:f.required,placeholder:f.placeholder||"",onChange:(e:any)=>setValues(v=>({...v,[f.id]:e.target.value}))};
    return <label key={f.id} className={f.type==="textarea"?"donation-field donation-field-full":"donation-field"}><span>{f.label}{f.required?" *":""}</span>
      {f.type==="textarea"?<textarea {...common} rows={4}/>:f.type==="select"?<select {...common}><option value="">নির্বাচন করুন</option>{(f.options||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>:<input {...common} type={f.type}/>}
    </label>;
  };
  return <section id="donation" className="donation-section section-anchor">
    <div className="container">
      <div className="section-heading centered"><div className="section-kicker">সহযোগিতা করুন</div><h2>{config.title}</h2><p>{config.description}</p></div>
      <div className="donation-grid">
        {config.bkash_number && <button className="donation-method-card" type="button" onClick={()=>openForm("বিকাশ")}><span className="donation-method-icon">৳</span><div><strong>{config.bkash_label}</strong><small>{config.bkash_number}</small></div><b>অনুদান দিন →</b></button>}
        {config.nagad_number && <button className="donation-method-card" type="button" onClick={()=>openForm("নগদ")}><span className="donation-method-icon">৳</span><div><strong>{config.nagad_label}</strong><small>{config.nagad_number}</small></div><b>অনুদান দিন →</b></button>}
        {config.bank_account_number && <button className="donation-method-card" type="button" onClick={()=>openForm("ব্যাংক")}><span className="donation-method-icon">🏦</span><div><strong>{config.bank_name||"ব্যাংক অ্যাকাউন্ট"}</strong><small>{config.bank_account_name} • {config.bank_account_number}{config.bank_branch?` • ${config.bank_branch}`:""}</small></div><b>অনুদান দিন →</b></button>}
      </div>
      <div className="donation-instruction"><strong>কীভাবে করবেন?</strong><span>{config.instruction}</span><button className="btn primary" type="button" onClick={()=>openForm(method)}>Donation Form খুলুন</button></div>
    </div>
    {open && <div className="donation-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOpen(false);}}>
      <div className="donation-modal" role="dialog" aria-modal="true" aria-label="Donation form">
        <button className="donation-modal-close" type="button" onClick={()=>!busy&&setOpen(false)}>×</button>
        <div className="section-kicker">DONATION FORM</div><h3>অনুদানের তথ্য দিন</h3><p>{config.instruction}</p>
        <form onSubmit={submit}><div className="donation-form-grid">{config.form_fields.map(renderField)}</div><button className="form-submit" disabled={busy}>{busy?"জমা হচ্ছে...":"অনুদানের তথ্য জমা দিন"}</button></form>
      </div>
    </div>}
  </section>;
}
