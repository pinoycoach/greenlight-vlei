import React, { useState } from 'react'
import { issueKYB } from '../api'
export default function Attest({ leiRecord, presentation, onBack }:{ leiRecord:any, presentation:any, onBack:()=>void }){
  const [out, setOut] = useState<any>(null)
  async function go(){ setOut(await issueKYB(leiRecord, presentation)) }
  return (<div><h2>3) Issue KYB Decision</h2>
    <p>We mint a portable <strong>KYB Decision VC</strong> with hash-linked evidence (LEI snapshot + presentation + timestamp + policy).</p>
    <button onClick={onBack}>Back</button><button onClick={go} style={{ marginLeft:8 }}>Issue</button>
    {out && (<div><p>✅ Issued. PDF: <a href={out.pdfUrl} target="_blank" rel="noreferrer">download</a></p>
      <pre style={{ background:'#0d1626', color:'#90e0a8', padding:12 }}>{JSON.stringify(out.issued, null, 2)}</pre>
      <p>Verifier link (local): <code>/api/verify-artifact?id={out.id}</code></p></div>)}
    </div>)
}
