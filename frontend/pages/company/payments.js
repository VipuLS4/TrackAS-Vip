import { useEffect, useState } from 'react';
export default function CompanyPayments(){
  const [rows,setRows] = useState([]);
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  useEffect(()=>{
    const token = localStorage.getItem('token');
    fetch(api+'/api/payments/company',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).then(setRows);
  },[]);
  return (<div style={{padding:20}}>
    <h2>Company Payments</h2>
    <pre>{JSON.stringify(rows,null,2)}</pre>
  </div>);
}
