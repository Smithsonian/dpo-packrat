import * as COMMON from '@dpo-packrat/common';
import * as DBAPI from '../../db';
import { ReportQueue } from '../../report/impl/ReportQueue';

// A minimal stand-in for DBAPI.WorkflowReport: the queue only reads/writes Data/Name/MimeType and
// calls update(). update() yields (setTimeout 0) so that, if writes were NOT serialized, concurrent
// read-modify-write cycles would interleave and lose events — locking in the ordering guarantee.
class FakeWorkflowReport {
    idWorkflowReport: number;
    Data: string;
    Name: string = '';
    MimeType: string;
    updateCount: number = 0;

    constructor(id: number, data: string = '[]', mimeType: string = 'text/html') {
        this.idWorkflowReport = id;
        this.Data = data;
        this.MimeType = mimeType;
    }

    async update(): Promise<boolean> {
        this.updateCount++;
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        return true;
    }
}

function fake(id: number, data?: string, mimeType?: string): DBAPI.WorkflowReport {
    return new FakeWorkflowReport(id, data, mimeType) as unknown as DBAPI.WorkflowReport;
}

function event(code: string): COMMON.IWorkflowReportEvent {
    return { ts: '2026-08-16T00:00:00.000Z', phase: 'cook', code, msg: code };
}

describe('Report: write queue', () => {
    test('appendEvent serializes concurrent writes in order with no lost events', async () => {
        const wr = fake(1);
        const codes = Array.from({ length: 25 }, (_v, i) => `evt-${i}`);
        await Promise.all(codes.map((c) => ReportQueue.appendEvent(wr, event(c))));

        const events = JSON.parse((wr as unknown as FakeWorkflowReport).Data) as COMMON.IWorkflowReportEvent[];
        expect(events).toHaveLength(codes.length);
        expect(events.map((e) => e.code)).toEqual(codes); // preserved call order, none dropped
    });

    test('appendEvent flips MimeType to application/json', async () => {
        const wr = fake(2, '[]', 'text/html');
        await ReportQueue.appendEvent(wr, event('a'));
        expect((wr as unknown as FakeWorkflowReport).MimeType).toBe('application/json');
    });

    test('appendEvent recovers a malformed body as a legacy.text event, then appends', async () => {
        const wr = fake(3, 'old <b>html</b> blob', 'text/html');
        await ReportQueue.appendEvent(wr, event('after'));

        const events = JSON.parse((wr as unknown as FakeWorkflowReport).Data) as COMMON.IWorkflowReportEvent[];
        expect(events).toHaveLength(2);
        expect(events[0].code).toBe(COMMON.WorkflowReportCode.LegacyText);
        expect(events[0].msg).toBe('old <b>html</b> blob');
        expect(events[1].code).toBe('after');
    });

    test('writes are isolated per idWorkflowReport (concurrent, different reports)', async () => {
        const a = fake(10);
        const b = fake(11);
        await Promise.all([
            ReportQueue.appendEvent(a, event('a1')),
            ReportQueue.appendEvent(b, event('b1')),
            ReportQueue.appendEvent(a, event('a2')),
            ReportQueue.appendEvent(b, event('b2')),
        ]);

        const aEvents = JSON.parse((a as unknown as FakeWorkflowReport).Data) as COMMON.IWorkflowReportEvent[];
        const bEvents = JSON.parse((b as unknown as FakeWorkflowReport).Data) as COMMON.IWorkflowReportEvent[];
        expect(aEvents.map((e) => e.code)).toEqual(['a1', 'a2']);
        expect(bEvents.map((e) => e.code)).toEqual(['b1', 'b2']);
    });

    test('appendEvent and setSummary on one report do not clobber each other', async () => {
        const wr = fake(20);
        await Promise.all([
            ReportQueue.appendEvent(wr, event('e1')),
            ReportQueue.setSummary(wr, { subject: 'DPO Testing', idSystemObject: 12178 }),
            ReportQueue.appendEvent(wr, event('e2')),
        ]);

        const backing = wr as unknown as FakeWorkflowReport;
        const events = JSON.parse(backing.Data) as COMMON.IWorkflowReportEvent[];
        const summary = JSON.parse(backing.Name) as COMMON.IWorkflowReportSummary;
        expect(events.map((e) => e.code)).toEqual(['e1', 'e2']); // Data intact
        expect(summary.idSystemObject).toBe(12178);               // Name intact
    });

    test('waitForQueueToDrain resolves after in-flight writes complete', async () => {
        const wr = fake(30);
        void ReportQueue.appendEvent(wr, event('x'));
        void ReportQueue.appendEvent(wr, event('y'));
        const result = await ReportQueue.waitForQueueToDrain(5000);
        expect(result.success).toBe(true);
        expect(JSON.parse((wr as unknown as FakeWorkflowReport).Data)).toHaveLength(2);
    });
});
