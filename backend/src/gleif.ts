import fetch from 'node-fetch';

const API = process.env.GLEIF_API || 'https://api.gleif.org/api/v1';

export async function searchLEI(q: string){
  const url = `${API}/lei-records?filter[entity.legalName]=${encodeURIComponent(q)}&page[size]=10`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GLEIF ${r.status}`);
  const json: any = await r.json();
  return (json.data || []).map((d: any) => ({
    lei: d.attributes?.lei || d.id,
    legalName: d.attributes?.entity?.legalName?.name || d.attributes?.entity?.legalName || 'Unknown',
    country: d.attributes?.entity?.legalAddress?.country,
    status: d.attributes?.registration?.status,
    registeredAt: d.attributes?.registration?.initialRegistrationDate,
  }));
}
