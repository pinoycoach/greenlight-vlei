import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';

export async function createPdf(vc: any, artifactId: string) {
  const pdfId = Date.now().toString(36);
  const file = `./tmp/${pdfId}.pdf`;

  await fs.promises.mkdir('./tmp', { recursive: true });

  const doc = new PDFDocument({ margin: 56 });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  // --- Contents you already had ---
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

  // --- TrustClick QR (points to this artifact) ---
 const publicBase = process.env.PUBLIC_BASE_URL || 'https://www.greenlightkyb.com';
const longUrl  = `${publicBase}/api/verify-artifact?id=${encodeURIComponent(artifactId)}&view=html`;
const shortUrl = `${publicBase}/v/${encodeURIComponent(artifactId)}`;
const verifyUrl = longUrl;  // <-- add this line

const qrSize = 128;
const qrBuf  = await QRCode.toBuffer(longUrl, { margin: 1, scale: 6 });

const pageW = doc.page.width;
const { right, top } = doc.page.margins;
const qrX = pageW - right - qrSize;
const qrY = top;

// Draw QR
doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
// Make the QR area itself clickable
doc.link(qrX, qrY, qrSize, qrSize, longUrl);

// Caption (avoid emojis; many PDF fonts don’t support them cleanly)
doc.fontSize(10).fillColor('#555')
   .text('Scan to verify (Valid / Invalid)', qrX, qrY + qrSize + 6, { width: qrSize, align: 'center' });

// Short, clickable URL (won’t wrap weirdly)
doc.fillColor('#2563EB')
   .text(shortUrl, qrX, qrY + qrSize + 22, { width: qrSize, align: 'center', link: shortUrl, underline: true });

doc.fillColor('black');

  doc.end();
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

return { pdfId, file, verifyUrl };
}
