import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { searchLEI } from './gleif.js';
import { verifyPresentation, store, verifyArtifact } from './verify.js';
import { issueKYB } from './kyb.js';
import { createPdf } from './pdf.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.get('/search-lei', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing q' });
  try { res.json(await searchLEI(q)); }
  catch (e:any) { res.status(500).json({ error: e.message }); }
});

app.post('/verify-presentation', async (req, res) => {
  try { res.json(await verifyPresentation(req.body)); }
  catch (e:any) { res.status(400).json({ ok:false, error: e.message }); }
});

app.post('/issue-kyb', async (req, res) => {
  const { leiRecord, presentation, policyId = 'KYB-POLICY-001' } = req.body || {};
  if (!leiRecord || !presentation) {
    return res.status(400).json({ error: 'Missing leiRecord or presentation' });
  }

  // 1) Build the KYB Decision VC
  const issued = await issueKYB(leiRecord, presentation, policyId);

  // 2) Save first to get an artifact id
  const id = store.save(issued);

  // 3) Create the PDF using that id (so QR links to /api/verify-artifact?id=<id>)
  const { pdfId, file, verifyUrl } = await createPdf(issued, id);

  // 4) Attach the pdfId to the stored record
  store.setPdf(id, pdfId);

  // 5) Respond
  res.json({
    ok: true,
    id,                  // the artifact id for verification
    issued,
    pdfId,
    pdfUrl: `/pdf/${pdfId}`,
    verifyUrl           // handy link you can show/QR
  });
});


app.get('/verify-artifact', (req, res) => {
  const id = String(req.query.id || '');
  if (!id) return res.status(400).json({ error:'Missing id' });
  const result = verifyArtifact(id);
  if (!result) return res.status(404).json({ error:'Not found' });
  res.json(result);
});

app.get('/pdf/:id', (req, res) => {
  const file = `./tmp/${req.params.id}.pdf`;
  res.sendFile(file, { root: process.cwd() });
});

const port = Number(process.env.PORT || 8787);
// Short, human URL for certificates → redirects to TrustClick HTML view
app.get('/v/:id', (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).send('missing id');
  res.redirect(302, `/api/verify-artifact?id=${encodeURIComponent(id)}&view=html`);
});

app.listen(port, () => console.log(`API on http://localhost:${port}`));
