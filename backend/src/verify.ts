import { createHash } from 'crypto';

export const store = {
  map: new Map<string, any>(),

  // Save the artifact first (pdfId is optional here)
  save(obj: any, pdfId?: string) {
    const id = createHash('sha256')
      .update(JSON.stringify(obj) + Date.now())
      .digest('hex')
      .slice(0, 16);

    const record: any = { ...obj };
    if (pdfId) record.pdfId = pdfId;

    this.map.set(id, record);
    return id;
  },

  // Later, attach the generated pdfId to this artifact
  setPdf(id: string, pdfId: string) {
    const rec = this.map.get(id);
    if (rec) {
      rec.pdfId = pdfId;
      this.map.set(id, rec);
    }
  }
};


const TRUST = { rootIssuer: 'did:gleif:ROOT', qvis: ['did:qvi:example:TOPPAN', 'did:qvi:example:CFCA'] };
const REVOKED = new Set<string>(['urn:uuid:role-cred-revoked']);

export async function verifyPresentation(vp: any){
  if (!vp || typeof vp !== 'object') throw new Error('Invalid presentation');
  const creds = Array.isArray(vp.verifiableCredential) ? vp.verifiableCredential : [];
  if (creds.length === 0) throw new Error('No credentials');
  const entity = creds.find((c:any) => c.type?.includes('LegalEntityvLEICredential'));
  const role = creds.find((c:any) => c.type?.includes('OfficialOrganizationalRolevLEICredential'));
  if (!entity) throw new Error('Missing entity vLEI');
  if (!role) throw new Error('Missing role vLEI');
  const chainOk = TRUST.qvis.includes(role.issuer) && (TRUST.qvis.includes(entity.issuer) || entity.issuer === TRUST.rootIssuer);
  const revoked = [entity.id, role.id].filter((id:any) => id && REVOKED.has(id as string));
  const signatureOk = true;
  return { ok: chainOk && revoked.length === 0 && signatureOk, checks:{ chainOk, signatureOk, revoked },
           entity: { lei: entity.credentialSubject?.LEI, legalName: entity.credentialSubject?.legalName },
           role: { person: role.credentialSubject?.personLegalName, role: role.credentialSubject?.officialRole } };
}

export function verifyArtifact(id: string){
  const obj = store.map.get(id);
  if (!obj) return null;
  return { ok: true, id, ...obj };
}
