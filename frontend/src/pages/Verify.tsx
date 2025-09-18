import React, { useState } from 'react'
import { verifyPresentation } from '../api'
const SAMPLE = `{
  "type": ["VerifiablePresentation"],
  "holder": "did:example:holder:jane",
  "verifiableCredential": [
    {
      "id": "urn:uuid:entity-cred-1",
      "type": ["VerifiableCredential", "LegalEntityvLEICredential"],
      "issuer": "did:qvi:example:TOPPAN",
      "credentialSubject": {
        "LEI": "529900T8BM49AURSDO55",
        "legalName": "Acme Widgets Ltd"
      }
    },
    {
      "id": "urn:uuid:role-cred-1",
      "type": ["VerifiableCredential", "OfficialOrganizationalRolevLEICredential"],
      "issuer": "did:qvi:example:TOPPAN",
      "credentialSubject": {
        "LEI": "529900T8BM49AURSDO55",
        "personLegalName": "Jane D. Officer",
        "officialRole": "Authorized Signatory"
      }
    }
  ]
}`
const REVOKED = `{
  "type": ["VerifiablePresentation"],
  "holder": "did:example:holder:jane",
  "verifiableCredential": [
    {
      "id": "urn:uuid:entity-cred-1",
      "type": ["VerifiableCredential", "LegalEntityvLEICredential"],
      "issuer": "did:qvi:example:TOPPAN",
      "credentialSubject": {
        "LEI": "529900T8BM49AURSDO55",
        "legalName": "Acme Widgets Ltd"
      }
    },
    {
      "id": "urn:uuid:role-cred-revoked",
      "type": ["VerifiableCredential", "OfficialOrganizationalRolevLEICredential"],
      "issuer": "did:qvi:example:TOPPAN",
      "credentialSubject": {
        "LEI": "529900T8BM49AURSDO55",
        "personLegalName": "Jane D. Officer",
        "officialRole": "Authorized Signatory"
      }
    }
  ]
}`
export default function Verify({ leiRecord, onBack, onNext }:{ leiRecord:any, onBack:()=>void, onNext:(vp:any)=>void }){
  const [text, setText] = useState(SAMPLE); const [result, setResult] = useState<any>(null)
  async function run(){ try{ const vp = JSON.parse(text); const r = await verifyPresentation(vp); setResult(r); if(r.ok) onNext(vp) }catch(e:any){ setResult({ ok:false, error:e.message }) } }
  return (<div><h2>2) Present & Verify vLEI</h2>
    <p>Use the default sample for a <strong>green pass</strong>. Click <button onClick={()=>setText(REVOKED)}>Use revoked demo</button> to simulate a <strong style={color:'#ff8080'}>red fail</strong>.</p>
    <textarea value={text} onChange={e=>setText(e.target.value)} rows={14} style={ width:'100%' } />
    <div style={ marginTop: 8 }><button onClick={onBack}>Back</button><button onClick={run} style={ marginLeft: 8 }>Verify with TrustClick</button></div>
    {result && (<pre style={ background:'#0d1626', color: result.ok ? '#90e0a8' : '#ffb3b3', padding:12, marginTop:12 }>{JSON.stringify(result,null,2)}</pre>)}</div>)
}
