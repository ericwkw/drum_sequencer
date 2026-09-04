import { describe, it, expect } from 'vitest';
import { computeStepDuration } from '../audioEngine';

describe('computeStepDuration', () => {
  const base = 0.25; // seconds per 16th at some tempo

  it('returns the base duration when swing is 0', () => {
    expect(computeStepDuration(0, base, 0)).toBeCloseTo(base);
    expect(computeStepDuration(1, base, 0)).toBeCloseTo(base);
  });

  it('lengthens even note indices and shortens odd ones', () => {
    const swing = 0.5;
    const factor = swing * 0.33;
    expect(computeStepDuration(0, base, swing)).toBeCloseTo(base * (1 + factor));
    expect(computeStepDuration(1, base, swing)).toBeCloseTo(base * (1 - factor));
    expect(computeStepDuration(2, base, swing)).toBeCloseTo(base * (1 + factor));
  });

  it('caps swing impact at 0.33 (max swing = 1)', () => {
    const factor = 1 * 0.33;
    expect(computeStepDuration(0, base, 1)).toBeCloseTo(base * (1 + factor));
    expect(computeStepDuration(1, base, 1)).toBeCloseTo(base * (1 - factor));
  });

  it('never breaks alternation across a pattern wrap, including odd step counts', () => {
    // Regression for the swing-drift bug: alternation used to be derived from
    // `currentStep % 2`, which resets to 0 on every loop wrap. For an odd step
    // count that produces two consecutive "lengthen" notes at the wrap boundary.
    // `computeStepDuration` is driven by an ever-incrementing note counter
    // instead, so parity must alternate strictly regardless of `steps`.
    const swing = 0.8;
    const steps = 7; // odd — the case that used to drift
    const durations: number[] = [];
    for (let loop = 0; loop < 3; loop++) {
      for (let i = 0; i < steps; i++) {
        durations.push(computeStepDuration(loop * steps + i, base, swing));
      }
    }
    // No two adjacent durations should both be "lengthened" (i.e. both above
    // the base) or both "shortened" (both below).
    for (let i = 1; i < durations.length; i++) {
      const prevLong = durations[i - 1] > base;
      const curLong = durations[i] > base;
      expect(curLong).toBe(!prevLong);
    }
  });

  it('every two consecutive notes sum to exactly 2x the base duration', () => {
    const swing = 0.6;
    for (let i = 0; i < 10; i += 2) {
      const sum = computeStepDuration(i, base, swing) + computeStepDuration(i + 1, base, swing);
      expect(sum).toBeCloseTo(base * 2);
    }
  });
});
