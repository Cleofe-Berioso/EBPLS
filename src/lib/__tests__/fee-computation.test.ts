import { describe, it, expect } from 'vitest';
import {
  classifyAssetBracket,
  classifyWorkerBracket,
  computeMayorsPermitFee,
  sumFeeComponents,
} from '../fee-computation';

describe('fee-computation', () => {
  it('classifies asset and worker brackets correctly', () => {
    expect(classifyAssetBracket('50000')).toBe('BELOW_100K');
    expect(classifyAssetBracket('150000')).toBe('FROM_100K_TO_250K');
    expect(classifyAssetBracket('300000')).toBe('FROM_250K_TO_500K');
    expect(classifyAssetBracket('600000')).toBe('FROM_500K_TO_2M');
    expect(classifyAssetBracket('20000000')).toBe('FROM_5M_TO_20M');

    expect(classifyWorkerBracket('0')).toBe('NONE');
    expect(classifyWorkerBracket('3')).toBe('FROM_1_TO_5');
    expect(classifyWorkerBracket('8')).toBe('FROM_6_TO_10');
    expect(classifyWorkerBracket('30')).toBe('FROM_11_TO_50');
    expect(classifyWorkerBracket('150')).toBe('FROM_100_TO_199');
    expect(classifyWorkerBracket('199')).toBe('FROM_100_TO_199');
    expect(classifyWorkerBracket('200')).toBe('FROM_200_OR_MORE');
  });

  it('computes mayor\'s permit fee and includes surcharge/interest for late renewals', () => {
    const input = {
      applicationType: 'RENEWAL' as const,
      lineOfBusiness: 'small retail',
      assetSize: '600000',
      totalEmployees: '12',
      isLateRenewal: true,
      lateMonths: 2,
    };

    const computed = computeMayorsPermitFee(input);
    // Base mayor's permit fee should be > 0
    expect(computed.mayorsPermitFee).toBeGreaterThanOrEqual(0);

    // For renewal with isLateRenewal true and lateMonths set, surcharge and interest keys are present
    // computeMayorsPermitFee returns surcharge and interest (applied when RENEWAL and isLateRenewal)
    // Default surcharge percent = 25% and monthly interest = 2%
    const base = computed.selectedMayorPermitFee;
    const expectedSurcharge = Math.round(base * 0.25);
    const expectedInterest = Math.round(base * 0.02 * 2);

    // computeMayorsPermitFee returns `surcharge` and `interest` fields
    expect(computed.surcharge).toBe(expectedSurcharge);
    expect(computed.interest).toBe(expectedInterest);
  });

  it('chooses the higher fee between asset and worker classifications', () => {
    const computed = computeMayorsPermitFee({
      applicationType: 'NEW',
      lineOfBusiness: 'Manufacturers / Importers / Producers',
      assetSize: '7000000',
      totalEmployees: '45',
    });

    expect(computed.assetBasedFee).toBe(4000);
    expect(computed.workerBasedFee).toBe(1800);
    expect(computed.selectedMayorPermitFee).toBe(4000);
    expect(computed.selectedClassification).toContain('Medium');
  });

  it('bypasses size and worker classification for fixed-fee categories', () => {
    const computed = computeMayorsPermitFee({
      applicationType: 'NEW',
      lineOfBusiness: 'Private Ports / Wharves',
      assetSize: '1',
      totalEmployees: '1',
    });

    expect(computed.selectedMayorPermitFee).toBe(50000);
    expect(computed.specialRuleApplied).toContain('Fixed fee');
  });

  it('sums fee components correctly', () => {
    const total = sumFeeComponents({
      mayorsPermitFee: 1000,
      regulatoryFees: 300,
      additionalCharges: 0,
      penalties: 0,
      surcharge: 250,
      interest: 40,
      closureCertificateFee: 0,
      arrears: 0,
      otherCharges: 10,
    });
    expect(total).toBe(1600);
  });
});
