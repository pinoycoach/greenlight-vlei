import { createHash } from 'crypto';
export async function issueKYB(leiRecord: any, presentation: any, policyId: string){
  const evidence = {
    leiHash: hash(leiRecord),
    presentationHash: hash(presentation),
    timestamp: new Date().toISOString(),
    policyId,
  };
  const vc = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'KYBDecisionCredential'],
    issuer: 'did:example:verifier:greenlight-vlei',
    issuanceDate: new Date().toISOString(),
    credentialSubject: { LEI: leiRecord.lei, decision: 'approved', policy: policyId },
    evidence
  };
  return vc;
}
function hash(o:any){ return createHash('sha256').update(JSON.stringify(o)).digest('hex'); }
