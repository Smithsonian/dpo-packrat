import { Config, AuditTier } from '../../config';
import { eAuditType } from '../../db/api/ObjectType';

describe('Config.audit (Phase 1 / Commit 2)', () => {
    test('defines all three DB-bound retention tiers', () => {
        expect(Config.audit.tiers[AuditTier.PROTECT].retainFullDataDays).toBe('forever');
        expect(Config.audit.tiers[AuditTier.PROTECT].retainSkeletonDays).toBe('forever');
        expect(typeof Config.audit.tiers[AuditTier.STANDARD].retainFullDataDays).toMatch(/number|string/);
        expect(typeof Config.audit.tiers[AuditTier.TRANSIENT].retainFullDataDays).toBe('number');
        expect(typeof Config.audit.tiers[AuditTier.TRANSIENT].retainSkeletonDays).toBe('number');
    });

    test('every declared eAuditType has an actionTiers entry (no silent fall-through)', () => {
        const assigned = Config.audit.actionTiers;
        const missing: string[] = [];
        for (const key of Object.keys(eAuditType)) {
            // enum reverse-maps numbers to names; skip numeric string keys.
            if (!isNaN(Number(key))) continue;
            if (key === 'eUnknown') continue; // sentinel, not emitted
            const enumValue = (eAuditType as unknown as Record<string, number>)[key];
            if (assigned[enumValue as eAuditType] === undefined)
                missing.push(key);
        }
        expect(missing).toEqual([]);
    });

    test('logOnlyObjectTypes covers the plan-enumerated FILLER entities', () => {
        expect(Config.audit.logOnlyObjectTypes.length).toBeGreaterThanOrEqual(8);
    });

    test('tx and retention knobs have sensible defaults', () => {
        expect(Config.audit.retentionBatchSize).toBeGreaterThan(0);
        expect(Config.audit.retentionJobCron).toMatch(/^[\d*\/, -]+(\s+[\d*\/, -]+){4}$/);
        expect(Config.audit.txStatementTimeoutMs).toBeGreaterThan(0);
        expect(Config.audit.txDeadlockRetries).toBeGreaterThanOrEqual(0);
    });
});
