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
// ---- URLs ----
const publicBase = process.env.PUBLIC_BASE_URL || 'https://www.greenlightkyb.com';
const longUrl  = `${publicBase}/api/verify-artifact?id=${encodeURIComponent(artifactId)}&view=html`;
const shortUrl = `${publicBase}/v/${encodeURIComponent(artifactId)}`;
const verifyUrl = longUrl; // returned

// ---- QR placement ----
const qrSize = 128; // points
const qrBuf  = await QRCode.toBuffer(longUrl, { margin: 1, scale: 6 });

const pageW = doc.page.width;
const { right, top } = doc.page.margins;

// right column “card” to keep things tidy
const pad     = 10;
const cardW   = qrSize + pad * 2;
const cardH   = qrSize + 40 + pad * 2; // QR + caption + link + padding
const cardX   = pageW - right - cardW; // align with right margin
const cardY   = top;

// 1) draw a white card so body text never bleeds under the QR
doc.save();
doc.fillColor('#FFFFFF').rect(cardX, cardY, cardW, cardH).fill();
doc.restore();

// 2) draw the QR (centered inside the card)
const qrX = cardX + pad;
const qrY = cardY + pad;

doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
// Make the QR itself clickable
doc.link(qrX, qrY, qrSize, qrSize, longUrl);

// 3) caption + short link (both centered and tidy)
const textBoxX = cardX + pad;         // same as qrX
const textBoxW = qrSize;              // same width as the QR
let textY = qrY + qrSize + 6;

doc.fontSize(9).fillColor('#555')
   .text('Scan to verify (Valid / Invalid)', textBoxX, textY, {
     width: textBoxW,
     align: 'center',
     lineBreak: false
   });

textY += 16;
doc.fontSize(9).fillColor('#2563EB')
   // show short URL but make click open the full URL
   .text(shortUrl, textBoxX, textY, {
     width: textBoxW,
     align: 'center',
     underline: true,
     link: longUrl,
     lineBreak: false
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
