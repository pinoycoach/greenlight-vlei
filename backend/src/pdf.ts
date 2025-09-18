import PDFDocument from 'pdfkit';
import fs from 'fs';
export async function createPdf(vc: any){
  const id = Date.now().toString(36);
  const file = `./tmp/${id}.pdf`;
  await fs.promises.mkdir('./tmp', { recursive: true });
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);
  doc.fontSize(18).text('Greenlight vLEI — KYB Decision Credential', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Issuer: ${vc.issuer}`);
  doc.text(`Issued: ${vc.issuanceDate}`);
  doc.text(`LEI: ${vc.credentialSubject?.LEI}`);
  doc.text(`Decision: ${vc.credentialSubject?.decision}`);
  doc.moveDown();
  doc.text('Evidence:');
  doc.text(JSON.stringify(vc.evidence, null, 2));
  doc.moveDown();
  doc.fontSize(10).text('Verify this artifact via the TrustClick verify endpoint.', { oblique: true });
  doc.end();
  await new Promise<void>((resolve, reject) => {
  stream.on('finish', () => resolve());
  stream.on('error', (e) => reject(e));
});
  return id;
}
