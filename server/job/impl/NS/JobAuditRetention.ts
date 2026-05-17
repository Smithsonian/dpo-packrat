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
 * Each run is wrapped in a Workflow + WorkflowStep + WorkflowReport so it
 * appears in the Workflow UI alongside Cook jobs / ingestions. The wrapper
 * is best-effort: if the 'Audit Retention' vocabulary term hasn't been seeded
 * yet, the wrap silently no-ops and the retention work still runs.
 */
import * as NS from 'node-schedule';
import * as COMMON from '@dpo-packrat/common';
import { Audit } from '../../../db/api/Audit';
import { Workflow } from '../../../db/api/Workflow';
import { WorkflowStep } from '../../../db/api/WorkflowStep';
import { WorkflowReport } from '../../../db/api/WorkflowReport';
import { eAuditType } from '../../../db/api/ObjectType';
import { Config, AuditTier } from '../../../config';
import { AuditFactory } from '../../../audit/interface/AuditFactory';
import { Actor } from '../../../audit/Actor';
import { withActor } from '../../../audit/resolveActor';
import { VocabularyCache } from '../../../cache/VocabularyCache';
import { RecordKeeper as RK } from '../../../records/recordKeeper';

type WorkflowFrame = {
    workflow: Workflow;
    step: WorkflowStep;
};

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
     * an admin entry point. Emits its own summary audit row and creates a
     * Workflow + WorkflowStep + WorkflowReport so the run is visible in the
     * Workflow UI alongside Cook jobs.
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

        let frame: WorkflowFrame | null = null;
        let workflowError: string | null = null;

        try {
            await withActor(Actor.system('AuditRetention'), async () => {
                frame = await JobAuditRetention.startWorkflowFrame({
                    standardTypesCount: standardTypes.length,
                    transientTypesCount: transientTypes.length,
                    standardFull, transientFull, transientSkeleton, batchSize,
                });

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
        } catch (err) {
            workflowError = err instanceof Error ? err.message : String(err);
            result.durationMs = Date.now() - started;
            RK.logError(RK.LogSection.eAUDIT, 'retention job threw',
                workflowError, result, 'Job.AuditRetention');
            throw err;
        } finally {
            JobAuditRetention.cancelRequested = false;
            if (frame) await JobAuditRetention.closeWorkflowFrame(frame, result, workflowError);
        }

        RK.logInfo(RK.LogSection.eAUDIT, 'retention job complete',
            undefined, result, 'Job.AuditRetention');
        return result;
    }

    /**
     * Create a Workflow + WorkflowStep (eRunning) for this retention run.
     * Returns null when the workflow type vocabulary isn't seeded yet so the
     * caller skips the wrap silently — the retention pass itself still runs.
     */
    private static async startWorkflowFrame(params: Record<string, unknown>): Promise<WorkflowFrame | null> {
        try {
            const idVWorkflowType = await VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eWorkflowTypeAuditRetention);
            const idVWorkflowStepType = await VocabularyCache.vocabularyEnumToId(COMMON.eVocabularyID.eWorkflowStepTypeStart);
            if (!idVWorkflowType || !idVWorkflowStepType) {
                RK.logWarning(RK.LogSection.eAUDIT, 'retention workflow wrap skipped',
                    'vocabulary terms not seeded (run Packrat.ALTER.sql)',
                    { idVWorkflowType, idVWorkflowStepType }, 'Job.AuditRetention');
                return null;
            }
            const dtNow = new Date();
            const workflow = new Workflow({
                idVWorkflowType,
                idProject: null,
                idUserInitiator: null,
                DateInitiated: dtNow,
                DateUpdated: dtNow,
                Parameters: JSON.stringify(params),
                idWorkflowSet: null,
                idWorkflow: 0,
            });
            if (!await workflow.create()) return null;

            const step = new WorkflowStep({
                idWorkflow: workflow.idWorkflow,
                idJobRun: null,
                idUserOwner: null,
                idVWorkflowStepType,
                State: COMMON.eWorkflowJobRunStatus.eRunning,
                DateCreated: dtNow,
                DateCompleted: null,
                idWorkflowStep: 0,
            });
            if (!await step.create()) return null;
            return { workflow, step };
        } catch (err) {
            RK.logError(RK.LogSection.eAUDIT, 'retention workflow wrap failed',
                err instanceof Error ? err.message : String(err), undefined, 'Job.AuditRetention');
            return null;
        }
    }

    /**
     * Close out the Workflow frame: write a WorkflowReport with the run summary,
     * update WorkflowStep state (eDone / eError / eCancelled), and stamp
     * Workflow.DateUpdated. Failures here log but never mask the caller's
     * result — the retention work itself has already happened.
     */
    private static async closeWorkflowFrame(frame: WorkflowFrame, result: RunResult, error: string | null): Promise<void> {
        try {
            const dtNow = new Date();
            const finalState: number = error
                ? COMMON.eWorkflowJobRunStatus.eError
                : result.cancelled
                    ? COMMON.eWorkflowJobRunStatus.eCancelled
                    : COMMON.eWorkflowJobRunStatus.eDone;
            frame.step.State = finalState;
            frame.step.DateCompleted = dtNow;
            await frame.step.update();

            const report = new WorkflowReport({
                idWorkflowReport: 0,
                idWorkflow: frame.workflow.idWorkflow,
                MimeType: 'application/json',
                Name: 'Audit Retention Run Summary',
                Data: JSON.stringify({ ...result, error: error ?? undefined }),
            });
            await report.create();

            frame.workflow.DateUpdated = dtNow;
            await frame.workflow.update();
        } catch (err) {
            RK.logError(RK.LogSection.eAUDIT, 'retention workflow close failed',
                err instanceof Error ? err.message : String(err),
                { idWorkflow: frame.workflow.idWorkflow }, 'Job.AuditRetention');
        }
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

/**
 * Collect eAuditType values that resolve to the given tier. Walks every numeric
 * eAuditType value and uses AuditFactory.resolveTier so unmapped types are
 * placed by Config.audit.defaultUnmappedTier rather than dropped.
 */
function tierTypes(tier: AuditTier): eAuditType[] {
    const out: eAuditType[] = [];
    for (const key of Object.keys(eAuditType)) {
        const numeric = Number(key);
        if (!Number.isFinite(numeric)) continue;
        if (numeric === eAuditType.eUnknown) continue;
        if (AuditFactory.resolveTier(numeric as eAuditType) === tier)
            out.push(numeric as eAuditType);
    }
    return out;
}
