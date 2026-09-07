/* eslint-disable @typescript-eslint/no-explicit-any */
import { EdanCollection } from '../../collections/impl';

// parseRetryAfter is a private static (TS-private only, reachable at runtime) — the pure part of the
// throttle-aware retry: turn a Retry-After header into a wait in ms, or null to fall back to backoff.
const parseRetryAfter = (EdanCollection as any).parseRetryAfter as (v: string | null) => number | null;

describe('EdanCollection.parseRetryAfter — Retry-After parsing', () => {
    test('absent or empty header → null (caller uses backoff)', () => {
        expect(parseRetryAfter(null)).toBeNull();
        expect(parseRetryAfter('')).toBeNull();
    });

    test('delta-seconds form → milliseconds', () => {
        expect(parseRetryAfter('0')).toBe(0);
        expect(parseRetryAfter('5')).toBe(5000);
        expect(parseRetryAfter('120')).toBe(120000);
    });

    test('HTTP-date form → non-negative wait until that time', () => {
        const future = new Date(Date.now() + 10000).toUTCString();
        const ms = parseRetryAfter(future);
        expect(ms).not.toBeNull();
        expect(ms as number).toBeGreaterThan(0);
        expect(ms as number).toBeLessThanOrEqual(10000);
        // a past date clamps to 0 rather than going negative
        const past = new Date(Date.now() - 10000).toUTCString();
        expect(parseRetryAfter(past)).toBe(0);
    });

    test('unparseable header → null', () => {
        expect(parseRetryAfter('not-a-date')).toBeNull();
    });
});
