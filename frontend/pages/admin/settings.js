import { useEffect, useState } from 'react';

export default function Settings(){
  const [settings,setSettings] = useState({});
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

  useEffect(()=>{
    const token = localStorage.getItem('token');
    fetch(api+'/api/admin/settings',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json()).then(setSettings);
  },[]);

  async function save(){
    const token = localStorage.getItem('token');
    await fetch(api+'/api/admin/settings',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(settings)});
    alert('Saved');
  }

  return (<div style={{padding:20}}>
    <h2>Commission Settings</h2>
    <label>Enabled: <input type="checkbox" checked={(settings.COMMISSION_ENABLED ?? 'true')==='true'} onChange={e=>setSettings({...settings, COMMISSION_ENABLED: e.target.checked?'true':'false'})}/></label><br/>
    <label>Rate (%): <input type="number" value={settings.COMMISSION_RATE ?? 2} onChange={e=>setSettings({...settings, COMMISSION_RATE: e.target.value})}/></label><br/>
    <label>Mode: 
      <select value={settings.COMMISSION_MODE ?? 'postpaid'} onChange={e=>setSettings({...settings, COMMISSION_MODE: e.target.value})}>
        <option value="prepaid">Before Shipment</option>
        <option value="postpaid">After Completion</option>
      </select>
    </label><br/>
    <button onClick={save}>Save</button>
  </div>);
}
