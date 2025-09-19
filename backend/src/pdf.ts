// A) if tsconfig has "esModuleInterop": true
import QRCode from 'qrcode';
// B) otherwise, use this instead:
// import * as QRCode from 'qrcode';

import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Create a PDF certificate with an embedded TrustClick QR.
 * @param vc          The KYB Decision VC object you already build.
 * @param artifactId  The id used by /api/verify-artifact?id=<artifactId>
 * @returns           { pdfId, file, verifyUrl }
 */
export async function createPdf(vc: any, artifactId: string) {
  const pdfId = Date.now().toString(36);
  const file = `./tmp/${pdfId}.pdf`;

  await fs.promises.mkdir('./tmp', { recursive: true });

  const doc = new PDFDocument({ margin: 56 }); // 0.78" margins
  const stream = fs.createWriteStream(file);
  doc.pipe(stream);

  // --- Header/content (yours) ---
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

  // ===== TrustClick QR (BEGIN) =====
  const publicBase = process.env.PUBLIC_BASE_URL || 'https://www.greenlightkyb.com';
  const verifyUrl = `${publicBase}/api/verify-artifact?id=${encodeURIComponent(artifactId)}&view=html`;

  // Buffer works best with pdfkit
  const qrSize = 128; // points (~1.8")
  const qrBuf = await QRCode.toBuffer(verifyUrl, { margin: 1, scale: 6 });

  const pageW = doc.page.width;
  const { left, right, top } = doc.page.margins;
  const qrX = pageW - right - qrSize; // flush to right margin
  const qrY = top;                    // at top margin

  doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });

  doc.fontSize(10).fillColor('#555');
  doc.text('Scan to verify (✅ Valid / ❌ Invalid)', qrX, qrY + qrSize + 6, {
    width: qrSize,
    align: 'center'
  });
  doc.fillColor('#3b82f6');
  doc.text(verifyUrl, qrX, qrY + qrSize + 22, { width: qrSize, align: 'center' });

  doc.fillColor('black'); // reset
  // ===== TrustClick QR (END) =====

  doc.end();
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', () => resolve());
    stream.on('error', reject);
  });

  return { pdfId, file, verifyUrl };
}
