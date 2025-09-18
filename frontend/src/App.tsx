import React, { useState } from 'react'
import Search from './pages/Search'
import Verify from './pages/Verify'
import Attest from './pages/Attest'
export default function App(){
  const [step, setStep] = useState(1)
  const [leiRecord, setLeiRecord] = useState<any>(null)
  const [presentation, setPresentation] = useState<any>(null)
  return (<div className="wrap"><h1>Greenlight vLEI — <span style={{color:'#90e0a8'}}>KYB in Under 2 Minutes</span></h1>
    <p>Search (LEI) → Verify (vLEI entity + role) → Issue (KYB Decision) → Share (TrustClick)</p>
    <div className="card">
      {step===1 && <Search onNext={(r:any)=>{setLeiRecord(r); setStep(2)}}/>}
      {step===2 && <Verify leiRecord={leiRecord} onBack={()=>setStep(1)} onNext={(vp:any)=>{setPresentation(vp); setStep(3)}}/>}
      {step===3 && <Attest leiRecord={leiRecord} presentation={presentation} onBack={()=>setStep(2)}/>}
    </div></div>)
}
