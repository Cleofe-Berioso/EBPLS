/**
 * SMS Notification Module
 * Supports Semaphore and Globe Labs API for Philippine SMS delivery
 */

export type SmsProvider = 'semaphore' | 'globe_labs';

export interface SmsMessage {
  to: string; // Philippine mobile number
  message: string;
  type?: 'OTP' | 'NOTIFICATION' | 'REMINDER';
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: SmsProvider;
}

// ============================================================================
// Phone Number Formatting
// ============================================================================

function formatPhoneNumber(phone: string): string {
  // Normalize to +63 format
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('0')) return '+63' + cleaned.slice(1);
  if (cleaned.startsWith('63')) return '+' + cleaned;
  if (cleaned.startsWith('+63')) return cleaned;
  return '+63' + cleaned;
}

// ============================================================================
// Semaphore SMS API (Philippine SMS Gateway)
// ============================================================================

const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY || '';
const SEMAPHORE_SENDER = process.env.SEMAPHORE_SENDER || 'BPERMIT';

async function sendViaSemaphore(message: SmsMessage): Promise<SmsResult> {
  try {
    if (!SEMAPHORE_API_KEY) {
      console.log(`[DEV SMS] To: ${message.to}, Message: ${message.message}`);
      return { success: true, messageId: `SEM-DEV-${Date.now()}`, provider: 'semaphore' };
    }

    const response = await fetch('https://api.semaphore.co/api/v4/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: SEMAPHORE_API_KEY,
        number: formatPhoneNumber(message.to),
        message: message.message,
        sendername: SEMAPHORE_SENDER,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Semaphore API error');
    }

    return {
      success: true,
      messageId: data[0]?.message_id?.toString(),
      provider: 'semaphore',
    };
  } catch (error) {
    console.error('Semaphore SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS sending failed',
      provider: 'semaphore',
    };
  }
}

// ============================================================================
// Globe Labs SMS API
// ============================================================================

const GLOBE_APP_ID = process.env.GLOBE_APP_ID || '';
const GLOBE_APP_SECRET = process.env.GLOBE_APP_SECRET || '';
const GLOBE_SHORT_CODE = process.env.GLOBE_SHORT_CODE || '';

async function sendViaGlobeLabs(message: SmsMessage): Promise<SmsResult> {
  try {
    if (!GLOBE_APP_ID || !GLOBE_APP_SECRET) {
      console.log(`[DEV SMS] To: ${message.to}, Message: ${message.message}`);
      return { success: true, messageId: `GLOBE-DEV-${Date.now()}`, provider: 'globe_labs' };
    }

    // Globe Labs requires an access token obtained through OAuth
    const accessToken = process.env.GLOBE_ACCESS_TOKEN || '';

    const response = await fetch(
      `https://devapi.globelabs.com.ph/smsmessaging/v1/outbound/${GLOBE_SHORT_CODE}/requests`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: GLOBE_APP_ID,
          app_secret: GLOBE_APP_SECRET,
          access_token: accessToken,
          outboundSMSMessageRequest: {
            clientCorrelator: `BPERMIT-${Date.now()}`,
            senderAddress: GLOBE_SHORT_CODE,
            outboundSMSTextMessage: { message: message.message },
            address: `tel:${formatPhoneNumber(message.to)}`,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Globe Labs API error');
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.outboundSMSMessageRequest?.clientCorrelator,
      provider: 'globe_labs',
    };
  } catch (error) {
    console.error('Globe Labs SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Globe Labs SMS failed',
      provider: 'globe_labs',
    };
  }
}

// ============================================================================
// SMS Gateway Factory
// ============================================================================

const DEFAULT_PROVIDER: SmsProvider = (process.env.SMS_PROVIDER as SmsProvider) || 'semaphore';

export async function sendSms(message: SmsMessage): Promise<SmsResult> {
  const provider = DEFAULT_PROVIDER;

  switch (provider) {
    case 'semaphore':
      return sendViaSemaphore(message);
    case 'globe_labs':
      return sendViaGlobeLabs(message);
    default:
      return sendViaSemaphore(message);
  }
}

// ============================================================================
// SMS Templates
// ============================================================================

export const smsTemplates = {
  otp: (code: string) =>
    `[Business Permit] Your OTP is ${code}. Valid for 15 minutes. Do not share this code with anyone.`,

  applicationSubmitted: (appNumber: string) =>
    `[Business Permit] Your application ${appNumber} has been submitted successfully. Track status at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tracking`,

  permitReady: (appNumber: string) =>
    `[Business Permit] Your permit for application ${appNumber} is ready for release. View claim details at ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/claim-reference`,

  applicationRejected: (appNumber: string, reason: string) =>
    `[Business Permit] Your application ${appNumber} was returned for revision. Reason: ${reason}. Please check your dashboard for details.`,

  claimReminder: (appNumber: string, date: string, time: string) =>
    `[Business Permit] Reminder: Claim your business permit for ${appNumber} on ${date} at ${time}. Bring your claim reference and valid ID.`,

  claimScheduled: (appNumber: string, date: string, time: string, refNumber: string) =>
    `[Business Permit] Claiming scheduled for ${appNumber} on ${date}, ${time}. Reference: ${refNumber}. Bring valid ID.`,

  passwordReset: (code: string) =>
    `[Business Permit] Your password reset code is ${code}. Valid for 15 minutes.`,

  permitExpiring: (permitNumber: string, expiryDate: string) =>
    `[Business Permit] Your permit ${permitNumber} expires on ${expiryDate}. Renew now at ${process.env.NEXT_PUBLIC_APP_URL}`,

  welcome: (name: string) =>
    `[Business Permit] Welcome, ${name}! Your account has been verified. Apply for your business permit online.`,
};

// ============================================================================
// High-Level SMS Functions
// ============================================================================

export async function sendOtpSms(phone: string, code: string): Promise<SmsResult> {
  return sendSms({ to: phone, message: smsTemplates.otp(code), type: 'OTP' });
}

export async function sendStatusNotification(
  phone: string,
  appNumber: string,
  status: string,
  reason?: string
): Promise<SmsResult> {
  let message: string;
  switch (status) {
    case 'SUBMITTED':
      message = smsTemplates.applicationSubmitted(appNumber);
      break;
    case 'READY_FOR_RELEASE':
    case 'RELEASED':
      message = smsTemplates.permitReady(appNumber);
      break;
    case 'RETURNED_FOR_CORRECTION':
    case 'REJECTED':
      message = smsTemplates.applicationRejected(appNumber, reason || 'See dashboard for details');
      break;
    default:
      message = `[Business Permit] Your application ${appNumber} status updated to: ${status}`;
  }

  return sendSms({ to: phone, message, type: 'NOTIFICATION' });
}

export async function sendClaimReminder(
  phone: string,
  appNumber: string,
  date: string,
  time: string
): Promise<SmsResult> {
  return sendSms({
    to: phone,
    message: smsTemplates.claimReminder(appNumber, date, time),
    type: 'REMINDER',
  });
}
