/**
 * Two-Factor Authentication (2FA/TOTP) Module
 * otplib integration with Google Authenticator support
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

const APP_NAME = process.env.TOTP_ISSUER || process.env.NEXT_PUBLIC_APP_NAME || 'BusinessPermit';

// TOTP default options
authenticator.options = {
  window: 1, // Allow 1 window before/after for clock drift
};

// ============================================================================
// TOTP Secret Generation
// ============================================================================

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

// ============================================================================
// QR Code for Authenticator App
// ============================================================================

export function getTotpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

export async function generateTotpQRCode(email: string, secret: string): Promise<string> {
  const uri = getTotpUri(email, secret);
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

// ============================================================================
// TOTP Verification
// ============================================================================

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

// ============================================================================
// Backup Codes
// ============================================================================

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    const code = Array.from(bytes)
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// ============================================================================
// 2FA Setup Response
// ============================================================================

export interface TwoFactorSetupData {
  secret: string;
  qrCodeDataUrl: string;
  uri: string;
  backupCodes: string[];
}

export async function setup2FA(email: string): Promise<TwoFactorSetupData> {
  const secret = generateTotpSecret();
  const qrCodeDataUrl = await generateTotpQRCode(email, secret);
  const uri = getTotpUri(email, secret);
  const backupCodes = generateBackupCodes();

  return {
    secret,
    qrCodeDataUrl,
    uri,
    backupCodes,
  };
}

export function verify2FASetup(token: string, secret: string): boolean {
  return verifyTotp(token, secret);
}
