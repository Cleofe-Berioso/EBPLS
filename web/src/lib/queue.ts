/**
 * BullMQ Job Queue Module
 * Background processing for emails, SMS, PDF generation, and reports
 */

import { Queue, Worker, type Job } from 'bullmq';

// ============================================================================
// Redis Connection Config (using bullmq's built-in ioredis)
// ============================================================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      ...(parsed.password ? { password: parsed.password } : {}),
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConfig = {
  ...parseRedisUrl(REDIS_URL),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// ============================================================================
// Queue Definitions
// ============================================================================

export type EmailJobData = {
  type: 'welcome' | 'otp' | 'status_update' | 'password_reset' | 'claim_confirmation' | 'permit_expiry';
  to: string;
  data: Record<string, string>;
};

export type SmsJobData = {
  type: 'otp' | 'status_notification' | 'claim_reminder';
  to: string;
  data: Record<string, string>;
};

export type PdfJobData = {
  type: 'permit' | 'report' | 'claim_stub';
  entityId: string;
  userId: string;
};

export type ReportJobData = {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  parameters: Record<string, unknown>;
  requestedBy: string;
};

// Create queues lazily
let emailQueue: Queue<EmailJobData> | null = null;
let smsQueue: Queue<SmsJobData> | null = null;
let pdfQueue: Queue<PdfJobData> | null = null;
let reportQueue: Queue<ReportJobData> | null = null;

function getQueue<T>(name: string, queueRef: Queue<T> | null): Queue<T> | null {
  if (queueRef) return queueRef;
  try {
    return new Queue(name, { connection: redisConfig }) as unknown as Queue<T>;
  } catch {
    return null;
  }
}

export function getEmailQueue() {
  emailQueue = getQueue('email', emailQueue);
  return emailQueue;
}

export function getSmsQueue() {
  smsQueue = getQueue('sms', smsQueue);
  return smsQueue;
}

export function getPdfQueue() {
  pdfQueue = getQueue('pdf', pdfQueue);
  return pdfQueue;
}

export function getReportQueue() {
  reportQueue = getQueue('report', reportQueue);
  return reportQueue;
}

// ============================================================================
// Job Enqueue Helpers (with fallback to synchronous processing)
// ============================================================================

export async function enqueueEmail(data: EmailJobData): Promise<string | null> {
  const queue = getEmailQueue();
  if (queue) {
    const job = await queue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { age: 3600 * 24 * 7 },
    });
    return job.id || null;
  }

  // Fallback: process synchronously
  await processEmailJob(data);
  return 'sync';
}

export async function enqueueSms(data: SmsJobData): Promise<string | null> {
  const queue = getSmsQueue();
  if (queue) {
    const job = await queue.add('send-sms', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { age: 3600 * 24 },
      removeOnFail: { age: 3600 * 24 * 7 },
    });
    return job.id || null;
  }

  await processSmsJob(data);
  return 'sync';
}

export async function enqueuePdf(data: PdfJobData): Promise<string | null> {
  const queue = getPdfQueue();
  if (queue) {
    const job = await queue.add('generate-pdf', data, {
      attempts: 2,
      removeOnComplete: { age: 3600 * 24 },
    });
    return job.id || null;
  }
  return 'sync';
}

export async function enqueueReport(data: ReportJobData): Promise<string | null> {
  const queue = getReportQueue();
  if (queue) {
    const job = await queue.add('generate-report', data, {
      attempts: 2,
      removeOnComplete: { age: 3600 * 24 * 7 },
    });
    return job.id || null;
  }
  return 'sync';
}

// ============================================================================
// Job Processors (synchronous fallback implementations)
// ============================================================================

async function processEmailJob(data: EmailJobData): Promise<void> {
  const { sendWelcomeEmail, sendOtpEmail, sendApplicationStatusEmail, sendPasswordResetEmail, sendClaimConfirmationEmail, sendPermitExpiryReminderEmail } = await import('@/lib/email');

  switch (data.type) {
    case 'welcome':
      await sendWelcomeEmail(data.to, data.data.name);
      break;
    case 'otp':
      await sendOtpEmail(data.to, data.data.otp, data.data.otpType as 'verification' | 'login' | 'reset');
      break;
    case 'status_update':
      await sendApplicationStatusEmail(data.to, data.data.name, data.data.appNumber, data.data.status, data.data.reason);
      break;
    case 'password_reset':
      await sendPasswordResetEmail(data.to, data.data.name, data.data.resetLink);
      break;
    case 'claim_confirmation':
      await sendClaimConfirmationEmail(data.to, data.data.name, data.data.appNumber, data.data.claimReference, data.data.date, data.data.time);
      break;
    case 'permit_expiry':
      await sendPermitExpiryReminderEmail(data.to, data.data.name, data.data.permitNumber, data.data.businessName, data.data.expiryDate);
      break;
  }
}

async function processSmsJob(data: SmsJobData): Promise<void> {
  const { sendOtpSms, sendStatusNotification, sendClaimReminder } = await import('@/lib/sms');

  switch (data.type) {
    case 'otp':
      await sendOtpSms(data.to, data.data.code);
      break;
    case 'status_notification':
      await sendStatusNotification(data.to, data.data.appNumber, data.data.status, data.data.reason);
      break;
    case 'claim_reminder':
      await sendClaimReminder(data.to, data.data.appNumber, data.data.date, data.data.time);
      break;
  }
}

// ============================================================================
// Workers (for production use — start separately)
// ============================================================================

export function startWorkers() {
  try {
    const emailWorker = new Worker<EmailJobData>(
      'email',
      async (job: Job<EmailJobData>) => {
        console.log(`[Email Worker] Processing job ${job.id}: ${job.data.type}`);
        await processEmailJob(job.data);
      },
      { connection: redisConfig, concurrency: 5 }
    );

    const smsWorker = new Worker<SmsJobData>(
      'sms',
      async (job: Job<SmsJobData>) => {
        console.log(`[SMS Worker] Processing job ${job.id}: ${job.data.type}`);
        await processSmsJob(job.data);
      },
      { connection: redisConfig, concurrency: 3 }
    );

    emailWorker.on('completed', (job) => console.log(`[Email] Job ${job.id} completed`));
    emailWorker.on('failed', (job, err) => console.error(`[Email] Job ${job?.id} failed:`, err));
    smsWorker.on('completed', (job) => console.log(`[SMS] Job ${job.id} completed`));
    smsWorker.on('failed', (job, err) => console.error(`[SMS] Job ${job?.id} failed:`, err));

    console.log('[Queue] Workers started: email, sms');

    return { emailWorker, smsWorker };
  } catch (err) {
    console.warn('[Queue] Redis not available — workers not started:', err);
    return null;
  }
}
