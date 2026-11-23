import { describe, it, expect } from 'vitest';
import {
  HybridLogicalClock,
  compareHlc,
  decodeHlc,
  encodeHlc,
  parseEnrollmentQr,
  HLC_MAX_DRIFT_MS,
} from '../src/sync/RemoteSyncAdapter';

describe('HybridLogicalClock', () => {
  it('is monotonic when the wall clock goes backwards', () => {
    let t = 1_800_000_000_000;
    const c = new HybridLogicalClock('dev_aaaaaaaaaaaaaaaa', null, () => t);
    const a = c.tick();
    t -= 60_000;
    const b = c.tick();
    expect(compareHlc(b, a)).toBe(1);
    expect(decodeHlc(b).wall).toBe(1_800_000_000_000);
  });

  it('resumes from a persisted value', () => {
    const last = encodeHlc({ wall: 1_900_000_000_000, counter: 7, node: 'dev_aaaaaaaaaaaaaaaa' });
    const c = new HybridLogicalClock('dev_aaaaaaaaaaaaaaaa', last, () => 1_000);
    expect(compareHlc(c.tick(), last)).toBe(1);
  });

  it('advances past a received timestamp', () => {
    const t = 1_800_000_000_000;
    const c = new HybridLogicalClock('dev_aaaaaaaaaaaaaaaa', null, () => t);
    const remote = encodeHlc({ wall: t + 1000, counter: 3, node: 'srv' });
    const merged = c.receive(remote);
    expect(compareHlc(merged, remote)).toBe(1);
    expect(compareHlc(c.tick(), merged)).toBe(1);
  });

  it('refuses a remote clock too far in the future', () => {
    const t = 1_800_000_000_000;
    const c = new HybridLogicalClock('dev_aaaaaaaaaaaaaaaa', null, () => t);
    const remote = encodeHlc({ wall: t + HLC_MAX_DRIFT_MS + 1, counter: 0, node: 'srv' });
    expect(() => c.receive(remote)).toThrow(RangeError);
  });

  it('orders by string comparison with node as tie-breaker', () => {
    const a = encodeHlc({ wall: 5, counter: 1, node: 'dev_a' });
    const b = encodeHlc({ wall: 5, counter: 1, node: 'dev_b' });
    const c = encodeHlc({ wall: 5, counter: 2, node: 'dev_a' });
    expect([c, b, a].sort()).toEqual([a, b, c]);
  });
});

describe('parseEnrollmentQr', () => {
  const tenant = '2f1c8a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b';
  const token = 'A'.repeat(43);

  it('accepts a well-formed code', () => {
    const raw = `bridgeaac://enroll?v=1&api=${encodeURIComponent('https://sync.example.org/')}&t=${tenant}&k=${token}`;
    expect(parseEnrollmentQr(raw)).toEqual({
      v: 1,
      api_base: 'https://sync.example.org',
      tenant_id: tenant,
      token,
    });
  });

  it('rejects plain-http origins and junk', () => {
    const raw = `bridgeaac://enroll?v=1&api=${encodeURIComponent('http://evil.example')}&t=${tenant}&k=${token}`;
    expect(parseEnrollmentQr(raw)).toBeNull();
    expect(parseEnrollmentQr('https://example.org')).toBeNull();
    expect(parseEnrollmentQr('not a url')).toBeNull();
  });
});
