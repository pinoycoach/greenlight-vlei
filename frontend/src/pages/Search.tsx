import React, { useState } from 'react'
import { searchLEI } from '../api'
export default function Search({ onNext }:{ onNext:(x:any)=>void }){
  const [q, setQ] = useState(''); const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(false)
  async function go(){ setLoading(true); try{ setRows(await searchLEI(q)) } finally{ setLoading(false) } }
  return (<div><h2>1) Search & Prefill</h2><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Enter legal name"/>
    <div style={{marginTop:8}}><button onClick={go} disabled={!q || loading}>Search</button></div>
    <ul>{rows.map(r=> (<li key={r.lei} style={{margin:'8px 0'}}><strong>{r.legalName}</strong> — {r.lei} ({r.country || '—'}) &nbsp;
      <button onClick={()=>onNext(r)} style={{ marginLeft: 12 }}>Select</button></li>))}</ul></div>)
}
