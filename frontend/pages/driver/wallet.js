import { useEffect, useState } from 'react';
export default function Wallet(){
  const [rows,setRows] = useState([]);
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  useEffect(()=>{
    const token = localStorage.getItem('token');
    // For MVP we reuse admin payments stream just to show data
    fetch(api+'/api/payments/admin',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).then(setRows);
  },[]);
  return (<div style={{padding:20}}>
    <h2>Wallet (Demo)</h2>
    <pre>{JSON.stringify(rows,null,2)}</pre>
  </div>);
}
