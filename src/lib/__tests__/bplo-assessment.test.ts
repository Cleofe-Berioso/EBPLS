import { describe, it, expect } from 'vitest';
import {
  buildAutomaticRenewalCharges,
  buildAutomaticLiquorTobaccoSurcharge,
  resolveApplicantPaymentFrequency,
  toReleasePaymentAmount,
} from '../bplo-assessment';

describe('bplo-assessment helpers', () => {
  it('builds renewal charges (surcharge + interest) correctly', () => {
    const base = 1000;
    const { surcharge, interest } = buildAutomaticRenewalCharges(base, 13, {});
    // default surcharge 25% -> 250
    // default interest 2% per month * 13 months -> 260
    expect(surcharge).toBe(250);
    expect(interest).toBe(260);
  });

  it('computes liquor/tobacco surcharge at 25%', () => {
    const addOn = buildAutomaticLiquorTobaccoSurcharge('NEW', 2000, true, {});
    expect(addOn).toBe(500);
  });

  it('resolves applicant payment frequency only from applicant data', () => {
    expect(resolveApplicantPaymentFrequency({ paymentFrequency: 'ANNUAL' })).toBe('ANNUAL');
    expect(resolveApplicantPaymentFrequency({ paymentFrequency: 'BI_ANNUAL' })).toBe('BI_ANNUAL');
    expect(resolveApplicantPaymentFrequency({ paymentFrequency: 'QUARTERLY' })).toBe('QUARTERLY');
    expect(resolveApplicantPaymentFrequency({})).toBeNull();
    expect(resolveApplicantPaymentFrequency({ paymentFrequency: 'INVALID' })).toBeNull();
  });

  it('toReleasePaymentAmount ignores BPLO logic and returns full annual amount', () => {
    expect(toReleasePaymentAmount(1200, 'QUARTERLY' as any)).toBe(1200);
  });
});
