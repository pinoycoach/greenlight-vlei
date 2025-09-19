import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import fs from 'fs';

export async function createPdf(vc: any, artifactId: string) {
  // ---- file setup ----
  const pdfId = Date.now().toString(36);
  const dir = './tmp';
  await fs.promises.mkdir(dir, { recursive: true });
  const file = `${dir}/${pdfId}.pdf`;

  const doc = new PDFDocument({ margin: 56 });
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  // ---- header/content (safe optional chaining) ----
  doc.fontSize(18).text('Greenlight vLEI — KYB Decision Credential', { underline: true });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Issuer: ${vc?.issuer ?? ''}`);
  doc.text(`Issued: ${vc?.issuanceDate ?? ''}`);
  doc.text(`LEI: ${vc?.credentialSubject?.LEI ?? ''}`);
  doc.text(`Decision: ${vc?.credentialSubject?.decision ?? ''}`);

  doc.moveDown();
  doc.text('Evidence:');
  try {
    doc.text(JSON.stringify(vc?.evidence ?? {}, null, 2));
  } catch {
    doc.text(String(vc?.evidence ?? ''));
  }

  doc.moveDown();
  doc.fontSize(10).text('Verify this artifact via the TrustClick verify endpoint.', { oblique: true });

  // ---- URLs ----
  const publicBase = process.env.PUBLIC_BASE_URL || 'https://www.greenlightkyb.com';
  const longUrl  = `${publicBase}/api/verify-artifact?id=${encodeURIComponent(artifactId)}&view=html`;
  const shortUrl = `${publicBase}/v/${encodeURIComponent(artifactId)}`;
  const verifyUrl = longUrl; // returned to caller

  // ---- QR code generation & placement ----
  const qrSize = 128; // points
  const qrBuf  = await QRCode.toBuffer(longUrl, { margin: 1, scale: 6 });

  const pageW = doc.page.width;
  const { right, top } = doc.page.margins;
  const qrX = pageW - right - qrSize;
  const qrY = top;

  // draw QR and make it clickable
  doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
  doc.link(qrX, qrY, qrSize, qrSize, longUrl);

  // caption + short, clickable URL
  doc.fontSize(10).fillColor('#555')
     .text('Scan to verify (Valid / Invalid)', qrX, qrY + qrSize + 6, { width: qrSize, align: 'center' });

  doc.fillColor('#2563EB')
     .text(shortUrl, qrX, qrY + qrSize + 22, {
       width: qrSize,
       align: 'center',
       link: longUrl,            // clicking the text opens the full long URL
       underline: true
     });

  doc.fillColor('black');

  // ---- finalize ----
  doc.end();
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { pdfId, file, verifyUrl };
}
