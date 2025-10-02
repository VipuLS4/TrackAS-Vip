import { useState } from 'react';
export default function RegisterCompany(){
  const [form,setForm] = useState({email:'',password:'',name:'',address:'',contact_name:'',contact_phone:'',tin:'',bank_account_number:'',bank_ifsc:'',bank_name:'',account_holder:''});
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  async function submit(){
    const r = await fetch(api+'/api/auth/register/company',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
    const j = await r.json();
    if (j.ok) alert('Registered. Await admin approval.'); else alert(JSON.stringify(j));
  }
  return (<div style={{padding:20}}>
    <h2>Register Company</h2>
    <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><br/>
    <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><br/>
    <input placeholder="Company Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><br/>
    <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><br/>
    <h4>Bank Details</h4>
    <input placeholder="Account Number" value={form.bank_account_number} onChange={e=>setForm({...form,bank_account_number:e.target.value})}/><br/>
    <input placeholder="IFSC" value={form.bank_ifsc} onChange={e=>setForm({...form,bank_ifsc:e.target.value})}/><br/>
    <input placeholder="Bank Name" value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})}/><br/>
    <input placeholder="Account Holder" value={form.account_holder} onChange={e=>setForm({...form,account_holder:e.target.value})}/><br/>
    <button onClick={submit}>Register</button>
  </div>);
}
