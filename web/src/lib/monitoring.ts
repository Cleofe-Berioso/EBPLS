/**
 * Monitoring & Error Tracking
 * Sentry integration for error tracking and performance monitoring
 * Prometheus-compatible metrics endpoint for Grafana dashboards
 */

// ============================================================================
// Sentry Client-Side Initialization
// ============================================================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

let sentryInitialized = false;

type SentryUser = {
  id: string;
  email?: string;
  role?: string;
} | null;

type SentryEvent = {
  request?: {
    headers?: Record<string, string>;
  };
};

type SentryScope = {
  setExtras(extras: Record<string, unknown>): void;
};

type SentryModule = {
  init(config: {
    dsn: string;
    environment: string;
    release: string;
    tracesSampleRate: number;
    replaysSessionSampleRate: number;
    replaysOnErrorSampleRate: number;
    integrations: unknown[];
    beforeSend(event: SentryEvent): SentryEvent;
  }): void;
  withScope(callback: (scope: SentryScope) => void): void;
  captureException(error: Error | unknown): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void;
  setUser(user: SentryUser): void;
};

let _sentryModule: SentryModule | null | undefined = undefined;

async function getSentry(): Promise<SentryModule | null> {
  if (_sentryModule !== undefined) return _sentryModule;
  try {
    // Use Function constructor to hide from Turbopack static analysis
    const loadModule = new Function('name', 'return require(name)') as (name: string) => unknown;
    _sentryModule = loadModule('@sentry/nextjs') as SentryModule;
    return _sentryModule;
  } catch {
    _sentryModule = null;
    return null;
  }
}

/**
 * Initialize Sentry (call once on app startup)
 */
export async function initSentry(): Promise<void> {
  if (sentryInitialized || !SENTRY_DSN) return;

  const Sentry = await getSentry();
  if (!Sentry) {
    console.warn('[Monitoring] Sentry not available — error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,
      tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      integrations: [],
      beforeSend(event: SentryEvent) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
    });
    sentryInitialized = true;
    console.log('[Monitoring] Sentry initialized');
  } catch {
    console.warn('[Monitoring] Sentry init failed');
  }
}

/**
 * Capture an exception in Sentry
 */
export async function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): Promise<void> {
  if (SENTRY_DSN) {
    const Sentry = await getSentry();
    if (Sentry) {
      try {
        if (context) {
          Sentry.withScope((scope: SentryScope) => {
            scope.setExtras(context);
            Sentry.captureException(error);
          });
        } else {
          Sentry.captureException(error);
        }
      } catch {
        // Sentry call failed
      }
    }
  }

  // Always log to console in development
  if (SENTRY_ENVIRONMENT !== 'production') {
    console.error('[Error]', error, context);
  }
}

/**
 * Capture a message in Sentry
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): Promise<void> {
  if (SENTRY_DSN) {
    const Sentry = await getSentry();
    if (Sentry) {
      try {
        Sentry.captureMessage(message, level);
      } catch {
        // Sentry call failed
      }
    }
  }
}

/**
 * Set user context in Sentry
 */
export async function setUser(user: {
  id: string;
  email?: string;
  role?: string;
} | null): Promise<void> {
  if (SENTRY_DSN) {
    const Sentry = await getSentry();
    if (Sentry) {
      try {
        Sentry.setUser(user);
      } catch {
        // Sentry call failed
      }
    }
  }
}

// ============================================================================
// Prometheus-Compatible Metrics
// ============================================================================

interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  value: number;
  labels: Record<string, string>;
  updatedAt: number;
}

const metrics = new Map<string, MetricEntry>();

export function incrementCounter(
  name: string,
  help: string,
  labels: Record<string, string> = {}
): void {
  const key = `${name}:${JSON.stringify(labels)}`;
  const existing = metrics.get(key);
  if (existing) {
    existing.value += 1;
    existing.updatedAt = Date.now();
  } else {
    metrics.set(key, { name, type: 'counter', help, value: 1, labels, updatedAt: Date.now() });
  }
}

export function setGauge(
  name: string,
  help: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  const key = `${name}:${JSON.stringify(labels)}`;
  metrics.set(key, { name, type: 'gauge', help, value, labels, updatedAt: Date.now() });
}

export function observeHistogram(
  name: string,
  help: string,
  value: number,
  labels: Record<string, string> = {}
): void {
  const key = `${name}:${JSON.stringify(labels)}`;
  const existing = metrics.get(key);
  if (existing) {
    // Simple average for in-memory
    existing.value = (existing.value + value) / 2;
    existing.updatedAt = Date.now();
  } else {
    metrics.set(key, { name, type: 'histogram', help, value, labels, updatedAt: Date.now() });
  }
}

/**
 * Format metrics in Prometheus exposition format
 */
export function getPrometheusMetrics(): string {
  const lines: string[] = [];
  const grouped = new Map<string, MetricEntry[]>();

  for (const entry of metrics.values()) {
    const group = grouped.get(entry.name) || [];
    group.push(entry);
    grouped.set(entry.name, group);
  }

  for (const [name, entries] of grouped) {
    const first = entries[0];
    lines.push(`# HELP ${name} ${first.help}`);
    lines.push(`# TYPE ${name} ${first.type}`);
    for (const entry of entries) {
      const labelStr = Object.entries(entry.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      lines.push(
        labelStr ? `${name}{${labelStr}} ${entry.value}` : `${name} ${entry.value}`
      );
    }
  }

  return lines.join('\n') + '\n';
}

// ============================================================================
// Pre-built Metric Helpers
// ============================================================================

export const AppMetrics = {
  httpRequest(method: string, path: string, status: number, durationMs: number) {
    incrementCounter('http_requests_total', 'Total HTTP requests', { method, path, status: String(status) });
    observeHistogram('http_request_duration_ms', 'HTTP request duration in ms', durationMs, { method, path });
  },

  applicationSubmitted(type: string) {
    incrementCounter('applications_submitted_total', 'Total applications submitted', { type });
  },

  applicationApproved() {
    incrementCounter('applications_approved_total', 'Total applications approved');
  },

  applicationRejected() {
    incrementCounter('applications_rejected_total', 'Total applications rejected');
  },

  permitIssued() {
    incrementCounter('permits_issued_total', 'Total permits issued');
  },

  paymentReceived(method: string, amount: number) {
    incrementCounter('payments_received_total', 'Total payments received', { method });
    observeHistogram('payment_amount', 'Payment amount in PHP', amount, { method });
  },

  documentUploaded(type: string) {
    incrementCounter('documents_uploaded_total', 'Total documents uploaded', { type });
  },

  loginAttempt(success: boolean) {
    incrementCounter('login_attempts_total', 'Total login attempts', { success: String(success) });
  },

  activeUsers(count: number) {
    setGauge('active_users', 'Currently active users', count);
  },

  queueDepth(queue: string, count: number) {
    setGauge('queue_depth', 'Number of jobs in queue', count, { queue });
  },
};
