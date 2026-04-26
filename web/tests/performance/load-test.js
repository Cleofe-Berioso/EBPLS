/**
 * k6 Performance / Load Tests
 * Online Business Permit System
 *
 * Installation:
 *   choco install k6  (Windows)
 *   brew install k6   (macOS)
 *   snap install k6   (Linux)
 *
 * Run:
 *   k6 run tests/performance/load-test.js
 *   k6 run --vus 50 --duration 5m tests/performance/load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate('errors');
const homepageLatency = new Trend('homepage_latency', true);
const loginLatency = new Trend('login_latency', true);
const apiLatency = new Trend('api_latency', true);
const applicationSubmitLatency = new Trend('application_submit_latency', true);
const requestCount = new Counter('total_requests');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  // Ramp-up stages
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 25 },   // Ramp up to 25 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 25 },   // Ramp down
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    // Response time thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    homepage_latency: ['p(95)<1500'],
    login_latency: ['p(95)<2000'],
    api_latency: ['p(95)<1000'],

    // Error rate
    errors: ['rate<0.05'],           // Less than 5% error rate
    http_req_failed: ['rate<0.05'],  // Less than 5% HTTP failures
  },
};

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ============================================================================
// Test Scenarios
// ============================================================================

export default function () {
  // Simulate typical user journey

  group('Public Pages', () => {
    // 1. Visit homepage
    const homeRes = http.get(`${BASE_URL}/`);
    homepageLatency.add(homeRes.timings.duration);
    requestCount.add(1);
    check(homeRes, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has content': (r) => r.body && r.body.length > 100,
    }) || errorRate.add(1);

    sleep(1);

    // 2. Visit requirements page
    const reqRes = http.get(`${BASE_URL}/requirements`);
    requestCount.add(1);
    check(reqRes, {
      'requirements page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 3. Visit how-to-apply page
    const howRes = http.get(`${BASE_URL}/how-to-apply`);
    requestCount.add(1);
    check(howRes, {
      'how-to-apply page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 4. Visit FAQs
    const faqRes = http.get(`${BASE_URL}/faqs`);
    requestCount.add(1);
    check(faqRes, {
      'FAQs page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(1);

  group('Auth Flow', () => {
    // 5. Visit login page
    const loginPageRes = http.get(`${BASE_URL}/login`);
    requestCount.add(1);
    check(loginPageRes, {
      'login page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.5);

    // 6. Attempt login (will fail but tests API response time)
    const loginRes = http.post(
      `${BASE_URL}/api/auth/callback/credentials`,
      JSON.stringify({
        email: `loadtest${__VU}@test.com`,
        password: 'TestPassword123!',
      }),
      { headers: HEADERS }
    );
    loginLatency.add(loginRes.timings.duration);
    requestCount.add(1);
    // We expect 401 or redirect — just checking it responds
    check(loginRes, {
      'login endpoint responds': (r) => r.status < 500,
    }) || errorRate.add(1);

    sleep(0.5);

    // 7. Visit register page
    const regRes = http.get(`${BASE_URL}/register`);
    requestCount.add(1);
    check(regRes, {
      'register page status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(1);

  group('API Endpoints', () => {
    // 8. Test API rate limiting behavior
    const apiRes = http.get(`${BASE_URL}/api/auth/session`, {
      headers: HEADERS,
    });
    apiLatency.add(apiRes.timings.duration);
    requestCount.add(1);
    check(apiRes, {
      'session API responds': (r) => r.status < 500,
    }) || errorRate.add(1);

    sleep(0.3);

    // 9. Test CSRF token endpoint
    const csrfRes = http.get(`${BASE_URL}/api/auth/csrf`, {
      headers: HEADERS,
    });
    requestCount.add(1);
    check(csrfRes, {
      'CSRF endpoint responds': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(2);
}

// ============================================================================
// Spike Test (separate scenario — run with: k6 run --tag testid=spike ...)
// ============================================================================

export function spikeTest() {
  const responses = http.batch([
    ['GET', `${BASE_URL}/`],
    ['GET', `${BASE_URL}/login`],
    ['GET', `${BASE_URL}/register`],
    ['GET', `${BASE_URL}/requirements`],
    ['GET', `${BASE_URL}/faqs`],
  ]);

  for (const res of responses) {
    check(res, {
      'spike: status < 500': (r) => r.status < 500,
    }) || errorRate.add(1);
  }

  sleep(0.1);
}

// ============================================================================
// Stress Test Options (use with: k6 run --config tests/performance/stress.json ...)
// ============================================================================

export const stressOptions = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    errors: ['rate<0.10'],
  },
};
