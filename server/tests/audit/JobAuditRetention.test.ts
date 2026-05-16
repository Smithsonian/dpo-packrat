import { JobAuditRetention } from '../../job/impl/NS/JobAuditRetention';
import { Audit } from '../../db/api/Audit';
import { AuditFactory } from '../../audit/interface/AuditFactory';
import { Config, AuditTier } from '../../config';
import { eAuditType } from '../../db/api/ObjectType';
import { VocabularyCache } from '../../cache/VocabularyCache';

describe('JobAuditRetention.run', () => {
    let skeletonSpy: jest.SpyInstance;
    let deleteSpy: jest.SpyInstance;
    let emitSpy: jest.SpyInstance;
    const batchSize = Config.audit.retentionBatchSize;

    beforeEach(() => {
        skeletonSpy = jest.spyOn(Audit, 'skeletonBefore').mockResolvedValue(0);
        deleteSpy = jest.spyOn(Audit, 'deleteBefore').mockResolvedValue(0);
        emitSpy = jest.spyOn(AuditFactory, 'emit').mockResolvedValue(true);
        // Skip workflow wrap so its DB writes don't fire incidental DBCreate audits.
        // Workflow wrapping is covered in JobAuditRetentionWorkflow.test.ts.
        jest.spyOn(VocabularyCache, 'vocabularyEnumToId').mockResolvedValue(undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    test('skeleton pass called for STANDARD and TRANSIENT with correct cutoffs', async () => {
        // One batch each, returning < batchSize to terminate the loop.
        skeletonSpy.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
        deleteSpy.mockResolvedValueOnce(3);

        const result = await JobAuditRetention.run();

        expect(result.skeletoned).toBe(15);
        expect(result.transientDeleted).toBe(3);
        expect(skeletonSpy).toHaveBeenCalledTimes(2);
        expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    test('skeleton pass loops until the batch is not full', async () => {
        skeletonSpy
            .mockResolvedValueOnce(batchSize)
            .mockResolvedValueOnce(batchSize)
            .mockResolvedValueOnce(1); // partial batch terminates loop
        deleteSpy.mockResolvedValue(0);

        const result = await JobAuditRetention.run();
        // Two STANDARD calls above + one TRANSIENT skeleton call of 0.
        expect(skeletonSpy).toHaveBeenCalledTimes(4);
        expect(result.skeletoned).toBe(2 * batchSize + 1);
    });

    test('PROTECT rows are never targeted — no tier-type for PROTECT appears in calls', async () => {
        await JobAuditRetention.run();
        for (const call of skeletonSpy.mock.calls) {
            const tiers = call[0] as eAuditType[];
            expect(tiers).not.toContain(eAuditType.eAuthDenied);   // PROTECT
            expect(tiers).not.toContain(eAuditType.eActionRetire); // PROTECT
        }
        for (const call of deleteSpy.mock.calls) {
            const tiers = call[0] as eAuditType[];
            expect(tiers).not.toContain(eAuditType.eAuthDenied);
            expect(tiers).not.toContain(eAuditType.eActionPublish);
        }
    });

    test('emits one eActionSystemMaintenance summary row', async () => {
        skeletonSpy.mockResolvedValueOnce(2);
        deleteSpy.mockResolvedValueOnce(4);
        await JobAuditRetention.run();
        expect(emitSpy).toHaveBeenCalledTimes(1);
        const args = emitSpy.mock.calls[0][0];
        expect(args.action).toBe(eAuditType.eActionSystemMaintenance);
        expect(args.payload).toMatchObject({ skeletoned: 2, transientDeleted: 4 });
        expect(typeof args.payload.durationMs).toBe('number');
    });

    test('cancel request between batches short-circuits remaining passes', async () => {
        // First call returns a full batch; before the next batch, cancel is requested.
        skeletonSpy.mockImplementationOnce(async () => {
            JobAuditRetention.requestCancel();
            return batchSize;
        });
        const result = await JobAuditRetention.run();
        expect(result.cancelled).toBe(true);
        // Only the first skeleton call happens; no delete pass; summary still emits.
        expect(skeletonSpy).toHaveBeenCalledTimes(1);
        expect(deleteSpy).not.toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    test('skeletonBefore is targeted at STANDARD and TRANSIENT tier types only', async () => {
        await JobAuditRetention.run();
        const allTiers = new Set<eAuditType>();
        for (const call of skeletonSpy.mock.calls)
            for (const t of call[0] as eAuditType[]) allTiers.add(t);

        // At least the core CRUD STANDARD types appear.
        expect(allTiers.has(eAuditType.eDBCreate)).toBe(true);
        expect(allTiers.has(eAuditType.eDBUpdate)).toBe(true);
        // And at least one TRANSIENT type appears.
        expect(
            allTiers.has(eAuditType.eHTTPDownload) ||
            allTiers.has(eAuditType.eGenDownloads) ||
            allTiers.has(eAuditType.eSolrRebuild)
        ).toBe(true);
    });

    test('TIER_FILLER never appears in any retention call', async () => {
        await JobAuditRetention.run();
        // FILLER has no actionTiers entry, so its absence is implicit — but
        // double-check by asserting STANDARD-only tiers contain only tiers of
        // Config.audit.actionTiers that are STANDARD or TRANSIENT.
        const standardAndTransient = new Set<eAuditType>();
        for (const [k, v] of Object.entries(Config.audit.actionTiers)) {
            if (v === AuditTier.STANDARD || v === AuditTier.TRANSIENT)
                standardAndTransient.add(Number(k) as eAuditType);
        }
        for (const call of [...skeletonSpy.mock.calls, ...deleteSpy.mock.calls]) {
            const tiers = call[0] as eAuditType[];
            for (const t of tiers)
                expect(standardAndTransient.has(t)).toBe(true);
        }
    });
});
