/**
 * PDF Permit Generation Module
 * Generates business permit PDFs with QR codes and digital signatures
 */

import QRCode from 'qrcode';

// ============================================================================
// QR Code Generation
// ============================================================================

export async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 150,
    margin: 1,
    color: { dark: '#1e3a5f', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
}

// ============================================================================
// Permit Data Types
// ============================================================================

export interface PermitPDFData {
  permitNumber: string;
  applicationNumber: string;
  businessName: string;
  businessAddress: string;
  businessType: string;
  ownerName: string;
  tinNumber?: string;
  dtiSecRegistration?: string;
  issueDate: string;
  expiryDate: string;
  lguName: string;
  lguAddress: string;
  mayorName: string;
  treasurerName: string;
  permitFee: number;
  totalAmount: number;
  qrCodeUrl?: string;
  verificationUrl: string;
}

// ============================================================================
// HTML-based Permit Template (for Puppeteer/server-side rendering)
// ============================================================================

export function generatePermitHTML(data: PermitPDFData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Business Permit - ${data.permitNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; color: #1a1a2e; background: #fff; }
    .permit-container { width: 210mm; min-height: 297mm; padding: 15mm 20mm; position: relative; }
    .border-frame { border: 3px double #1e3a5f; padding: 12mm; min-height: 267mm; position: relative; }
    .inner-border { border: 1px solid #1e3a5f; padding: 8mm; min-height: 243mm; }

    /* Header */
    .header { text-align: center; margin-bottom: 6mm; }
    .header .republic { font-size: 11pt; letter-spacing: 1px; color: #444; }
    .header .lgu-name { font-size: 16pt; font-weight: bold; color: #1e3a5f; margin: 2mm 0; letter-spacing: 2px; }
    .header .lgu-address { font-size: 10pt; color: #555; }
    .header-line { border-bottom: 2px solid #1e3a5f; margin: 4mm 0; }
    .header-line-thin { border-bottom: 1px solid #c0c0c0; margin-bottom: 4mm; }

    /* Title */
    .permit-title { text-align: center; margin: 6mm 0; }
    .permit-title h1 { font-size: 22pt; color: #1e3a5f; letter-spacing: 3px; text-transform: uppercase; }
    .permit-title .permit-number { font-size: 13pt; color: #b8860b; margin-top: 2mm; font-weight: bold; letter-spacing: 1px; }

    /* Body */
    .permit-body { margin: 8mm 0; font-size: 11pt; line-height: 1.8; }
    .permit-body .intro { text-align: justify; margin-bottom: 6mm; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 4mm 0; }
    .detail-table td { padding: 2mm 4mm; vertical-align: top; }
    .detail-table .label { font-weight: bold; color: #1e3a5f; width: 45%; }
    .detail-table .value { color: #333; border-bottom: 1px dotted #ccc; }

    /* Certification */
    .certification { margin-top: 8mm; text-align: justify; font-size: 10.5pt; line-height: 1.7; }

    /* Signatures */
    .signatures { display: flex; justify-content: space-between; margin-top: 15mm; }
    .signature-block { text-align: center; width: 45%; }
    .signature-block .name { font-weight: bold; font-size: 12pt; text-transform: uppercase; border-top: 1px solid #333; padding-top: 2mm; margin-top: 12mm; }
    .signature-block .title { font-size: 9pt; color: #666; }

    /* QR Code */
    .qr-section { position: absolute; bottom: 15mm; right: 15mm; text-align: center; }
    .qr-section img { width: 25mm; height: 25mm; }
    .qr-section .qr-label { font-size: 7pt; color: #888; margin-top: 1mm; }

    /* Footer */
    .footer { position: absolute; bottom: 5mm; left: 0; right: 0; text-align: center; font-size: 8pt; color: #999; }
    .validity-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2mm 6mm; border-radius: 3mm; font-size: 10pt; font-weight: bold; margin: 4mm 0; border: 1px solid #a5d6a7; }
    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72pt; color: rgba(30, 58, 95, 0.04); font-weight: bold; white-space: nowrap; pointer-events: none; z-index: 0; }
  </style>
</head>
<body>
  <div class="permit-container">
    <div class="border-frame">
      <div class="inner-border">
        <div class="watermark">OFFICIAL DOCUMENT</div>

        <!-- Header -->
        <div class="header">
          <div class="republic">Republic of the Philippines</div>
          <div class="lgu-name">${escapeHtml(data.lguName)}</div>
          <div class="lgu-address">${escapeHtml(data.lguAddress)}</div>
        </div>
        <div class="header-line"></div>
        <div class="header-line-thin"></div>

        <!-- Permit Title -->
        <div class="permit-title">
          <h1>Business Permit</h1>
          <div class="permit-number">No. ${escapeHtml(data.permitNumber)}</div>
        </div>

        <!-- Validity Badge -->
        <div style="text-align: center;">
          <span class="validity-badge">
            ✓ VALID: ${escapeHtml(data.issueDate)} to ${escapeHtml(data.expiryDate)}
          </span>
        </div>

        <!-- Permit Body -->
        <div class="permit-body">
          <p class="intro">
            This is to certify that the business establishment described herein has complied with
            the requirements and conditions prescribed under the Local Revenue Code and other
            existing laws, rules, and regulations, and is hereby granted this <strong>BUSINESS PERMIT</strong>
            to operate within the territorial jurisdiction of ${escapeHtml(data.lguName)}.
          </p>

          <table class="detail-table">
            <tr>
              <td class="label">Business Name:</td>
              <td class="value">${escapeHtml(data.businessName)}</td>
            </tr>
            <tr>
              <td class="label">Business Address:</td>
              <td class="value">${escapeHtml(data.businessAddress)}</td>
            </tr>
            <tr>
              <td class="label">Nature of Business:</td>
              <td class="value">${escapeHtml(data.businessType)}</td>
            </tr>
            <tr>
              <td class="label">Owner/Proprietor:</td>
              <td class="value">${escapeHtml(data.ownerName)}</td>
            </tr>
            ${data.tinNumber ? `<tr><td class="label">TIN Number:</td><td class="value">${escapeHtml(data.tinNumber)}</td></tr>` : ''}
            ${data.dtiSecRegistration ? `<tr><td class="label">DTI/SEC Registration:</td><td class="value">${escapeHtml(data.dtiSecRegistration)}</td></tr>` : ''}
            <tr>
              <td class="label">Application Number:</td>
              <td class="value">${escapeHtml(data.applicationNumber)}</td>
            </tr>
            <tr>
              <td class="label">Date Issued:</td>
              <td class="value">${escapeHtml(data.issueDate)}</td>
            </tr>
            <tr>
              <td class="label">Valid Until:</td>
              <td class="value">${escapeHtml(data.expiryDate)}</td>
            </tr>
            <tr>
              <td class="label">Permit Fee Paid:</td>
              <td class="value">₱${data.totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <!-- Certification -->
        <div class="certification">
          <p>
            This permit is non-transferable and shall be displayed conspicuously at the place
            of business at all times. This permit is valid only for the calendar year indicated
            above and is subject to revocation for violation of any law, ordinance, or regulation.
          </p>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-block">
            <div class="name">${escapeHtml(data.treasurerName)}</div>
            <div class="title">Municipal/City Treasurer</div>
          </div>
          <div class="signature-block">
            <div class="name">${escapeHtml(data.mayorName)}</div>
            <div class="title">Municipal/City Mayor</div>
          </div>
        </div>

        <!-- QR Code -->
        ${data.qrCodeUrl ? `
        <div class="qr-section">
          <img src="${data.qrCodeUrl}" alt="Verification QR Code" />
          <div class="qr-label">Scan to verify</div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>Verify this permit at: ${escapeHtml(data.verificationUrl)}</p>
          <p>This document is system-generated. Digital verification available via QR code.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// Permit PDF Generation (using HTML → PDF conversion)
// ============================================================================

export async function generatePermitPDF(data: PermitPDFData): Promise<Buffer> {
  // Generate QR code with verification URL
  const qrData = JSON.stringify({
    permitNumber: data.permitNumber,
    businessName: data.businessName,
    verifyAt: data.verificationUrl,
  });
  data.qrCodeUrl = await generateQRCode(qrData);

  const html = generatePermitHTML(data);
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '10mm', bottom: '12mm', left: '10mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// Claim Stub Generator
// ============================================================================

export function generateClaimStubHTML(data: {
  referenceNumber: string;
  applicationNumber: string;
  applicantName: string;
  businessName: string;
  scheduleDate: string;
  scheduleTime: string;
  qrCodeUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Claim Stub - ${data.referenceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; }
    .stub { border: 2px solid #1e3a5f; border-radius: 8px; padding: 20px; }
    .title { text-align: center; color: #1e3a5f; font-size: 16pt; font-weight: bold; margin-bottom: 10px; }
    .subtitle { text-align: center; color: #666; font-size: 10pt; margin-bottom: 15px; }
    .ref-number { text-align: center; font-size: 18pt; font-weight: bold; color: #b8860b; margin: 10px 0; letter-spacing: 2px; }
    .detail { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ddd; font-size: 10pt; }
    .detail .label { color: #666; }
    .detail .value { font-weight: bold; }
    .qr { text-align: center; margin-top: 15px; }
    .qr img { width: 100px; height: 100px; }
    .notice { font-size: 8pt; color: #999; text-align: center; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="stub">
    <div class="title">🏛️ CLAIM STUB</div>
    <div class="subtitle">Online Business Permit System</div>
    <div class="ref-number">${escapeHtml(data.referenceNumber)}</div>
    <div class="detail"><span class="label">Applicant:</span><span class="value">${escapeHtml(data.applicantName)}</span></div>
    <div class="detail"><span class="label">Business:</span><span class="value">${escapeHtml(data.businessName)}</span></div>
    <div class="detail"><span class="label">Application #:</span><span class="value">${escapeHtml(data.applicationNumber)}</span></div>
    <div class="detail"><span class="label">Schedule Date:</span><span class="value">${escapeHtml(data.scheduleDate)}</span></div>
    <div class="detail"><span class="label">Schedule Time:</span><span class="value">${escapeHtml(data.scheduleTime)}</span></div>
    ${data.qrCodeUrl ? `<div class="qr"><img src="${data.qrCodeUrl}" alt="QR Code" /></div>` : ''}
    <div class="notice">Present this stub along with a valid ID when claiming your permit.</div>
  </div>
</body>
</html>`;
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Build the default permit data from database records
 */
export function buildPermitPDFData(permit: {
  permitNumber: string;
  businessName: string;
  businessAddress: string;
  ownerName: string;
  issueDate: Date;
  expiryDate: Date;
  application: {
    applicationNumber: string;
    businessType: string;
    tinNumber?: string | null;
    dtiSecRegistration?: string | null;
  };
}): PermitPDFData {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8000';

  return {
    permitNumber: permit.permitNumber,
    applicationNumber: permit.application.applicationNumber,
    businessName: permit.businessName,
    businessAddress: permit.businessAddress,
    businessType: permit.application.businessType,
    ownerName: permit.ownerName,
    tinNumber: permit.application.tinNumber || undefined,
    dtiSecRegistration: permit.application.dtiSecRegistration || undefined,
    issueDate: permit.issueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    expiryDate: permit.expiryDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }),
    lguName: process.env.LGU_NAME || 'Local Government Unit',
    lguAddress: process.env.LGU_ADDRESS || 'Municipal/City Hall, Philippines',
    mayorName: process.env.MAYOR_NAME || 'Hon. Municipal/City Mayor',
    treasurerName: process.env.TREASURER_NAME || 'Municipal/City Treasurer',
    permitFee: 0,
    totalAmount: 0,
    verificationUrl: `${appUrl}/verify?permit=${permit.permitNumber}`,
  };
}
