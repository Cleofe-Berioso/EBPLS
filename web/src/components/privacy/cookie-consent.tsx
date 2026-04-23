'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  timestamp: string;
}

const CONSENT_KEY = 'bp_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    functional: false,
    timestamp: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Show banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = useCallback((prefs: ConsentPreferences) => {
    const data = { ...prefs, timestamp: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    setVisible(false);
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: true, functional: true, timestamp: '' });
  }, [saveConsent]);

  const acceptNecessary = useCallback(() => {
    saveConsent({ necessary: true, analytics: false, functional: false, timestamp: '' });
  }, [saveConsent]);

  const saveCustom = useCallback(() => {
    saveConsent(preferences);
  }, [saveConsent, preferences]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 bg-white border-t-2 border-blue-600 shadow-2xl">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="text-2xl">🍪</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Data Privacy & Cookie Notice
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              In compliance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>,
              we use cookies and collect personal data to process your business permit application.
              Your data is protected and processed in accordance with Philippine data privacy laws.
              {' '}
              <Link href="/data-privacy" className="text-blue-600 underline">
                Read our full Data Privacy Policy
              </Link>
            </p>

            {showDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-3 space-y-3">
                <label className="flex items-start gap-3 cursor-not-allowed">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <div>
                    <span className="font-medium text-gray-900">Strictly Necessary</span>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Always Active</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Required for authentication, security, and core functionality.
                      Cannot be disabled.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences((p) => ({ ...p, functional: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Functional Cookies</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Remember your preferences, such as language, for a better experience.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Analytics Cookies</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Help us understand how you use the system to improve our services.
                      Data is anonymized.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={acceptAll}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={acceptNecessary}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Necessary Only
              </button>
              {showDetails ? (
                <button
                  onClick={saveCustom}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Preferences
                </button>
              ) : (
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 text-blue-600 text-sm font-medium hover:underline"
                >
                  Customize
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Data Collection Consent Modal (for form submissions)
// ============================================================================

export function DataCollectionConsent({
  onConsent,
  onDecline,
  purpose,
}: {
  onConsent: () => void;
  onDecline: () => void;
  purpose: string;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        🛡️ Data Privacy Consent
      </h4>
      <p className="text-sm text-blue-800 mb-3">
        In compliance with <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012),
        we need your consent to collect and process your personal information for the purpose of:
      </p>
      <p className="text-sm font-medium text-blue-900 mb-3 pl-4 border-l-2 border-blue-400">
        {purpose}
      </p>
      <ul className="text-xs text-blue-700 mb-3 space-y-1">
        <li>• Your data will be processed securely and confidentially</li>
        <li>• You have the right to access, correct, or delete your data</li>
        <li>• Data will be retained per government record-keeping requirements</li>
        <li>• Contact our Data Protection Officer for concerns: <Link href="/contact" className="underline">Contact Page</Link></li>
      </ul>
      <div className="flex gap-2">
        <button
          onClick={onConsent}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          I Consent
        </button>
        <button
          onClick={onDecline}
          className="px-4 py-2 text-blue-600 text-sm font-medium hover:underline"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Utility: Get consent status
// ============================================================================

export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function hasConsented(): boolean {
  return getConsentPreferences() !== null;
}

export function revokeConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CONSENT_KEY);
}
