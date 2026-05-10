/**
 * Audit retention job.
 *
 * Three passes per run:
 *   1. Skeleton STANDARD+TRANSIENT rows older than their full-data cutoff —
 *      NULL out Data, keep the row.
 *   2. Delete TRANSIENT rows older than their skeleton cutoff.
 *   3. Emit one eActionSystemMaintenance audit row summarizing the run.
 *
 * TIER_PROTECT rows are never touched; TIER_FILLER lives only in OpenObserve.
 *
 * Each pass chunks writes to Config.audit.retentionBatchSize so the lock
 * window stays bounded. SIGINT between batches aborts cleanly.
 *
 * The job is a plain function — no Workflow wrapper — per the plan's staging.
 * Hash-chain integrity + Workflow wrapping is a deferred follow-up.
 */
import * as NS from 'node-schedule';
import { Audit } from '../../../db/api/Audit';
import { eAuditType } from '../../../db/api/ObjectType';
import { Config, AuditTier } from '../../../config';
import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { Actor } from '../../../audit/Actor';
import { withActor } from '../../../audit/resolveActor';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

type RunResult = {
    skeletoned: number;
    transientDeleted: number;
    durationMs: number;
    cancelled: boolean;
};

export class JobAuditRetention {
    private static scheduled: NS.Job | null = null;
    /** Set to true by a SIGINT handler to short-circuit between batches. */
    private static cancelRequested: boolean = false;

    /**
     * Run the full retention pass once. Safe to invoke directly from tests or
     * an admin entry point. Emits its own summary audit row.
     */
    static async run(): Promise<RunResult> {
        const started = Date.now();
        const result: RunResult = { skeletoned: 0, transientDeleted: 0, durationMs: 0, cancelled: false };

        const tiers = Config.audit.tiers;
        const batchSize = Config.audit.retentionBatchSize;

        // Resolve tier -> fullCutoff / skeletonCutoff from config days.
        const now = Date.now();
        const standardFull = resolveCutoff(tiers[AuditTier.STANDARD].retainFullDataDays, now);
        const transientFull = resolveCutoff(tiers[AuditTier.TRANSIENT].retainFullDataDays, now);
        const transientSkeleton = resolveCutoff(tiers[AuditTier.TRANSIENT].retainSkeletonDays, now);

        // Collect the eAuditType values that belong to each tier.
        const standardTypes = tierTypes(AuditTier.STANDARD);
        const transientTypes = tierTypes(AuditTier.TRANSIENT);

        try {
            await withActor(Actor.system('AuditRetention'), async () => {
                // Pass 1: skeleton STANDARD past full-data cutoff.
                if (standardTypes.length > 0 && standardFull) {
                    result.skeletoned += await JobAuditRetention.runPass(
                        'skeleton-standard',
                        (n) => Audit.skeletonBefore(standardTypes, standardFull, n),
                        batchSize,
                    );
                }

                // Pass 1b: skeleton TRANSIENT past full-data cutoff.
                if (!JobAuditRetention.cancelRequested && transientTypes.length > 0 && transientFull) {
                    result.skeletoned += await JobAuditRetention.runPass(
                        'skeleton-transient',
                        (n) => Audit.skeletonBefore(transientTypes, transientFull, n),
                        batchSize,
                    );
                }

                // Pass 2: delete TRANSIENT past skeleton cutoff.
                if (!JobAuditRetention.cancelRequested && transientTypes.length > 0 && transientSkeleton) {
                    result.transientDeleted += await JobAuditRetention.runPass(
                        'delete-transient',
                        (n) => Audit.deleteBefore(transientTypes, transientSkeleton, n),
                        batchSize,
                    );
                }

                result.cancelled = JobAuditRetention.cancelRequested;
                result.durationMs = Date.now() - started;

                // Pass 3: summary audit row.
                await AuditFactory.emit({
                    action: eAuditType.eActionSystemMaintenance,
                    actor: Actor.system('AuditRetention'),
                    payload: {
                        skeletoned: result.skeletoned,
                        transientDeleted: result.transientDeleted,
                        durationMs: result.durationMs,
                        cancelled: result.cancelled,
                    },
                });
            });
        } finally {
            JobAuditRetention.cancelRequested = false;
        }

        RK.logInfo(RK.LogSection.eAUDIT, 'retention job complete',
            undefined, result, 'Job.AuditRetention');
        return result;
    }

    /**
     * Repeatedly invoke `passFn` with batchSize until it returns 0 or a
     * cancellation is requested. Each batch runs as its own statement so the
     * lock window never exceeds a single chunk.
     */
    private static async runPass(
        name: string,
        passFn: (batchSize: number) => Promise<number>,
        batchSize: number,
    ): Promise<number> {
        let total = 0;
        while (!JobAuditRetention.cancelRequested) {
            const affected = await passFn(batchSize);
            total += affected;
            if (affected < batchSize) break;
        }
        RK.logDebug(RK.LogSection.eAUDIT, `retention pass ${name}`,
            undefined, { total }, 'Job.AuditRetention');
        return total;
    }

    /**
     * Schedule the job under node-schedule using Config.audit.retentionJobCron.
     * Idempotent — repeated calls return the prior handle.
     */
    static schedule(): NS.Job | null {
        if (JobAuditRetention.scheduled) return JobAuditRetention.scheduled;
        const cron = Config.audit.retentionJobCron;
        try {
            const job = NS.scheduleJob(cron, () => {
                void JobAuditRetention.run().catch(err => {
                    RK.logError(RK.LogSection.eAUDIT, 'retention job failed',
                        err instanceof Error ? err.message : String(err),
                        undefined, 'Job.AuditRetention');
                });
            });
            if (!job) {
                RK.logError(RK.LogSection.eAUDIT, 'retention schedule failed',
                    `node-schedule returned null for cron=${cron}`,
                    { cron }, 'Job.AuditRetention');
                return null;
            }
            JobAuditRetention.scheduled = job;
            RK.logInfo(RK.LogSection.eAUDIT, 'retention scheduled',
                undefined, { cron }, 'Job.AuditRetention');
            return job;
        } catch (err) {
            RK.logError(RK.LogSection.eAUDIT, 'retention schedule failed',
                err instanceof Error ? err.message : String(err),
                { cron }, 'Job.AuditRetention');
            return null;
        }
    }

    /** Request an orderly shutdown between batches. Wired from SIGINT. */
    static requestCancel(): void {
        JobAuditRetention.cancelRequested = true;
    }
}

/**
 * Compute a Date `days` in the past, or null when retention is 'forever'.
 */
function resolveCutoff(days: number | 'forever', nowMs: number): Date | null {
    if (days === 'forever') return null;
    return new Date(nowMs - days * 24 * 60 * 60 * 1000);
}

/** Collect eAuditType values that map to the given tier from Config.audit.actionTiers. */
function tierTypes(tier: AuditTier): eAuditType[] {
    const out: eAuditType[] = [];
    for (const [key, value] of Object.entries(Config.audit.actionTiers)) {
        if (value === tier) out.push(Number(key) as eAuditType);
    }
    return out;
}
