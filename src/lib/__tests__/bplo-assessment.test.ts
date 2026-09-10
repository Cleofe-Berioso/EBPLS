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

  it('uses Super Admin penalty percents and honors extension waivers', () => {
    const base = 1000;
    const withCustom = buildAutomaticRenewalCharges(base, 13, {
      penalties: { renewalSurchargePercent: 10, monthlyInterestPercent: 1 },
    });
    expect(withCustom.surcharge).toBe(100);
    expect(withCustom.interest).toBe(130);

    const waived = buildAutomaticRenewalCharges(base, 13, {
      penalties: { renewalSurchargePercent: 25, monthlyInterestPercent: 2 },
      activeExtension: { waiveSurcharge: true, waiveInterest: true },
    });
    expect(waived.surcharge).toBe(0);
    expect(waived.interest).toBe(0);
  });

  it('computes liquor/tobacco surcharge at 25%', () => {
    const addOn = buildAutomaticLiquorTobaccoSurcharge('NEW', 2000, true, {});
    expect(addOn).toBe(500);
  });

  it('closure applications skip liquor/tobacco surcharge', () => {
    expect(buildAutomaticLiquorTobaccoSurcharge('CLOSURE', 2000, true, {})).toBe(0);
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
