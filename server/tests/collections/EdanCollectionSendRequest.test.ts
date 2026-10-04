/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
// Hermetic coverage for the throttle-aware retry loop in EdanCollection.sendRequest
// (TR-13). node-fetch is mocked for responses; setTimeout is stubbed to fire
// immediately (and capture the requested wait) so the backoff never runs in real
// time. Retryable statuses (401/408/429/503) retry with backoff / Retry-After;
// non-retryable statuses and eventual success return immediately.
//
// ts-jest doesn't hoist jest.mock, and the app's module graph may have already
// loaded EdanCollection with the real node-fetch; so reset the registry, doMock
// node-fetch, and re-require EdanCollection to bind it to the mock. The freshly
// loaded module tree uses its own RK/Logger, which the honesty gate does not wrap,
// so error-path logs here do not trip the gate.

let EdanCollection: any;
const mockFetch = jest.fn();

beforeAll(() => {
    jest.resetModules();
    jest.doMock('node-fetch', () => ({ __esModule: true, default: mockFetch }));
    EdanCollection = require('../../collections/impl').EdanCollection;
});
afterAll(() => { jest.dontMock('node-fetch'); });

// Minimal node-fetch Response with the fields sendRequest reads.
function res(status: number, ok: boolean, body: string = '', retryAfter?: string): any {
    return {
        ok,
        status,
        statusText: `status ${status}`,
        text: jest.fn(async () => body),
        headers: { get: (h: string) => (h.toLowerCase() === 'retry-after' ? (retryAfter ?? null) : null) },
    };
}

describe('EdanCollection.sendRequest — throttle-aware retry', () => {
    let edan: any;
    let timeoutSpy: jest.SpyInstance;

    beforeEach(() => {
        edan = new EdanCollection();
        mockFetch.mockReset();
        // Fire the callback synchronously (no real wait); the arg captures the delay.
        timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((cb: any) => { if (typeof cb === 'function') cb(); return 0 as any; }) as any);
    });
    afterEach(() => { timeoutSpy.mockRestore(); jest.restoreAllMocks(); });

    // eType=eEDAN(1), eMethod=eGet(1); enums are module-private, pass their values.
    const send = (): Promise<any> => (edan as any).sendRequest(1, 1, 'metadata/v2.0/search', '');

    test('a 200 returns success on the first attempt', async () => {
        mockFetch.mockResolvedValueOnce(res(200, true, 'OK'));
        const r = await send();
        expect(r.success).toBe(true);
        expect(r.output).toBe('OK');
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('a non-retryable 404 returns immediately without retrying or waiting', async () => {
        mockFetch.mockResolvedValueOnce(res(404, false, 'nope'));
        const r = await send();
        expect(r.success).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(timeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 500);
    });

    test('a persistent 503 retries up to MAX_ATTEMPTS then returns failure', async () => {
        mockFetch.mockResolvedValue(res(503, false, ''));
        const r = await send();
        expect(r.success).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(4);                                   // MAX_ATTEMPTS
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);           // backoff before attempt 2
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);          // backoff before attempt 4
    });

    test('a retryable status that then succeeds returns success', async () => {
        mockFetch
            .mockResolvedValueOnce(res(429, false, ''))
            .mockResolvedValueOnce(res(503, false, ''))
            .mockResolvedValueOnce(res(200, true, 'DONE'));
        const r = await send();
        expect(r.success).toBe(true);
        expect(r.output).toBe('DONE');
        expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('Retry-After is honored over the default backoff', async () => {
        mockFetch
            .mockResolvedValueOnce(res(503, false, '', '5'))    // Retry-After: 5 seconds
            .mockResolvedValueOnce(res(200, true, 'OK'));
        const r = await send();
        expect(r.success).toBe(true);
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);          // 5s, not the 500ms backoff
    });

    test('a fetch that throws is retried with backoff, then succeeds', async () => {
        mockFetch
            .mockRejectedValueOnce(new Error('ECONNRESET'))
            .mockResolvedValueOnce(res(200, true, 'OK'));
        const r = await send();
        expect(r.success).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    });
});
