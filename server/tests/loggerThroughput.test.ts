/* eslint-disable @typescript-eslint/no-explicit-any */
import { RecordKeeper as RK } from '../records/recordKeeper';
import { Logger } from '../records/logger/log';
import { Config } from '../config';

// Throughput + reliability check for the rate-managed logger. The suite logs
// synchronously (the rate manager is off under Jest), so this test turns the manager
// on for the duration of its own body only, floods it with uniquely-tagged entries,
// and captures what the manager actually delivers to its post sink. It asserts every
// entry is delivered exactly once — no loss, no duplication — and reports the sustained
// delivery rate so the manager's targetRate can be tuned against a known-safe rate.
//
// The manager is enabled and fully stopped inside the test body (Logger.shutdown in the
// finally) so the rate manager and its transport-monitor interval do not bleed into the
// harness teardown — otherwise afterEach/afterAll would wait on a queue that the
// manager's own periodic logging keeps non-empty.
//
// Opt-in (it deliberately floods and takes seconds): run with
//   PACKRAT_TEST_LOG_THROUGHPUT=1 [PACKRAT_TEST_LOG_THROUGHPUT_N=5000] yarn test --testPathPattern=loggerThroughput
// SKIP_REASON: load/throughput probe; opt-in via PACKRAT_TEST_LOG_THROUGHPUT=1 so normal runs stay fast.
const RUN: boolean = process.env.PACKRAT_TEST_LOG_THROUGHPUT === '1';
const d = RUN ? describe : describe.skip;

d('Logger throughput + reliability (rate manager)', () => {
    const N: number = Number(process.env.PACKRAT_TEST_LOG_THROUGHPUT_N ?? '2000');

    test(`delivers ${N} entries exactly once and reports sustained rate`, async () => {
        const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
        const tag: string = 'THRU-' + Math.random().toString(36).slice(2, 12);
        const posted: number[] = [];

        // Turn the rate manager on for this body only; capture every delivered entry at
        // the manager's post sink (avoids log-file flush timing).
        process.env.PACKRAT_TEST_LOG_RATE_MANAGER = '1';
        const postSpy: jest.SpyInstance = jest.spyOn(Logger as any, 'postLogToWinston').mockImplementation(async (entry: any) => {
            const data = entry?.data;
            if (data && data.thruTag === tag && typeof data.seq === 'number')
                posted.push(data.seq);
            return { success: true, message: 'captured' };
        });
        await RK.initialize(RK.SubSystem.LOGGER); // rebuild logger WITH the rate manager, capturing the spied sink

        try {
            const start: number = Date.now();
            for (let i = 0; i < N; i++)
                RK.logInfo(RK.LogSection.eTEST, 'throughput probe', `seq ${i}`, { thruTag: tag, seq: i }, 'ThroughputTest');

            // Wait until OUR tagged entries are all delivered (not global queue idle — the
            // manager's own periodic logging can keep the queue non-empty indefinitely).
            const deadlineMs: number = 90000;
            while (new Set(posted).size < N && Date.now() - start < deadlineMs)
                await sleep(100);
            const elapsedSec: number = (Date.now() - start) / 1000;

            const unique: Set<number> = new Set(posted);
            const duplicates: number = posted.length - unique.size;
            const missing: number[] = [];
            for (let i = 0; i < N; i++)
                if (!unique.has(i)) missing.push(i);
            const rate: number = Math.round(unique.size / Math.max(elapsedSec, 0.001));

            // Report (visible in test output) so the safe sustained rate can be read off.
            // eslint-disable-next-line no-console
            console.log(`[logger-throughput] N=${N} delivered=${posted.length} unique=${unique.size} ` +
                `duplicates=${duplicates} missing=${missing.length} elapsed=${elapsedSec.toFixed(2)}s ` +
                `rate≈${rate}/s targetRate=${Config.log.targetRate}`);

            expect(duplicates).toBe(0);
            expect(missing.length).toBe(0);
            expect(unique.size).toBe(N);
        } finally {
            // Fully stop the manager + its transport-monitor interval, then restore the
            // suite default (synchronous logging) so the harness teardown stays instant.
            postSpy.mockRestore();
            delete process.env.PACKRAT_TEST_LOG_RATE_MANAGER;
            await Logger.shutdown();
            await RK.initialize(RK.SubSystem.LOGGER);
        }
    });
});
