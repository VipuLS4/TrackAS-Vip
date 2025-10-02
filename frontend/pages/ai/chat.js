
import { useState } from 'react';
export default function Chat(){
  const [messages,setMessages] = useState([{from:'bot',text:'Hello — I am TrackAS assistant. Ask me about shipments, commission, or registration.'}]);
  const [text,setText] = useState('');
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
  async function send(){
    if (!text) return;
    setMessages(m=>[...m,{from:'user',text}]);
    const r = await fetch(api+'/api/ai/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from:'web',text})});
    const j = await r.json();
    setMessages(m=>[...m,{from:'bot',text:j.reply}]);
    setText('');
  }
  return (<div style={{padding:20}}>
    <h2>TrackAS AI Assistant</h2>
    <div style={{border:'1px solid #ddd',height:300,overflow:'auto',padding:10}}>
      {messages.map((m,i)=>(<div key={i} style={{margin:6}}><b>{m.from}:</b> {m.text}</div>))}
    </div>
    <input style={{width:'70%'}} value={text} onChange={e=>setText(e.target.value)} placeholder="Type your question..."/>
    <button onClick={send}>Send</button>
  </div>);
}
